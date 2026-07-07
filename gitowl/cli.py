"""GitOwl command-line interface.

Subcommands:
  review-diff   Review a unified diff from a file or stdin (prints Markdown).
  review-pr     Fetch a GitHub PR diff, review it, and optionally post a comment.
  providers     List available AI providers.

Run `python -m gitowl.cli --help` for details.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from gitowl import __version__
from gitowl.ai_client.base import AIProviderError
from gitowl.ai_client.registry import available_providers
from gitowl.comment import render_comment, render_error_comment
from gitowl.config import Config, ConfigError, load_config
from gitowl.describe import describe_diff, merge_into_body, render_description
from gitowl.logging_config import get_logger, setup_logging
from gitowl.reviewer import Review, empty_review, review_diff

logger = get_logger(__name__)


def _run_semgrep_if_available(diff_text: str, config: Config) -> list:
    """Best-effort Semgrep scan; returns [] if Semgrep isn't installed."""
    from gitowl import semgrep_runner
    from gitowl.diff_utils import parse_stats

    if not semgrep_runner.is_available():
        logger.info("Semgrep not installed; skipping static analysis.")
        return []
    stats = parse_stats(diff_text)
    try:
        return semgrep_runner.scan_diff_files(
            stats.changed_files, timeout_seconds=config.semgrep_timeout_seconds
        )
    except semgrep_runner.SemgrepError as exc:
        logger.warning("Semgrep failed, continuing without it: %s", exc)
        return []


def _force_utf8_output() -> None:
    """Ensure stdout/stderr can emit UTF-8 (Windows consoles default to cp1252).

    The rendered comment contains emoji/box-drawing; without this, printing
    crashes with UnicodeEncodeError on a default Windows terminal.
    """
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if callable(reconfigure):
            try:
                reconfigure(encoding="utf-8", errors="replace")
            except (ValueError, OSError):  # pragma: no cover - stream not reconfigurable
                pass


def _load_diff(source: str | None) -> str:
    if source is None or source == "-":
        return sys.stdin.read()
    path = Path(source)
    if not path.is_file():
        raise ConfigError(f"diff file not found: {source}")
    return path.read_text(encoding="utf-8")


def _emit(review: Review) -> None:
    print(render_comment(review.result, review.stats))


def cmd_review_diff(args: argparse.Namespace, config: Config) -> int:
    diff_text = _load_diff(args.file)
    if not diff_text.strip():
        _emit(empty_review("Empty diff — nothing to review."))
        return 0
    findings = [] if args.no_semgrep else _run_semgrep_if_available(diff_text, config)
    review = review_diff(diff_text, config, semgrep_findings=findings)
    _emit(review)
    return 0


def cmd_review_pr(args: argparse.Namespace, config: Config) -> int:
    from gitowl.dashboard import PolicyDisabled, fetch_policy_override
    from gitowl.github_client import GitHubClient, GitHubError

    if not config.github_token:
        raise ConfigError("GITHUB_TOKEN is required for review-pr.")
    github_token = config.github_token

    try:
        config = fetch_policy_override(args.repo, config)
    except PolicyDisabled as exc:
        logger.info("%s", exc)
        return 0

    client = GitHubClient(github_token)

    # Fetch PR head SHA for Check Run (best-effort — don't fail if it errors).
    pr_sha: str | None = None
    try:
        pr_sha = client.fetch_pr_sha(args.repo, args.pr)
    except GitHubError as exc:
        logger.warning("Could not fetch PR SHA (Check Run skipped): %s", exc)

    try:
        diff_text = client.fetch_pr_diff(args.repo, args.pr)
    except GitHubError as exc:
        logger.error("%s", exc)
        if args.post:
            _post_error(client, args, pr_sha, f"GitHub API error: {exc}")
        return 2

    if not diff_text.strip():
        review = empty_review("Empty diff — nothing to review.")
    else:
        findings = [] if args.no_semgrep else _run_semgrep_if_available(diff_text, config)
        try:
            review = review_diff(diff_text, config, semgrep_findings=findings)
        except AIProviderError as exc:
            logger.error("AI provider error: %s", exc)
            if args.post:
                _post_error(client, args, pr_sha, str(exc))
            return 3

    from gitowl.dashboard import send_usage_metrics

    send_usage_metrics(args.repo, args.pr, review.result)

    body = render_comment(review.result, review.stats)
    if args.post:
        try:
            client.post_or_update_comment(args.repo, args.pr, body)
            print(f"Posted review to {args.repo}#{args.pr}")
            if args.suggest:
                from gitowl.suggest import build_inline_suggestions

                suggestions = build_inline_suggestions(review.result.findings, diff_text)
                posted = client.post_review_comments(args.repo, args.pr, suggestions)
                print(f"Posted {posted} inline suggestion(s).")
        except GitHubError as exc:
            logger.error("%s", exc)
            return 2

        # Post a Check Run so the risk badge appears in the PR Checks section.
        # Clicking "Details" opens this panel with the full review.
        if pr_sha:
            _post_check_run_best_effort(client, args.repo, pr_sha, review.result, body)
    else:
        print(body)
    return 0


def _risk_conclusion(result: object) -> str:
    """Map RiskLevel → GitHub Check Run conclusion string."""
    from gitowl.models import ReviewResult, RiskLevel

    assert isinstance(result, ReviewResult)
    mapping = {
        RiskLevel.LOW: "success",
        RiskLevel.MEDIUM: "neutral",
        RiskLevel.HIGH: "failure",
    }
    return mapping.get(result.risk, "neutral")


def _check_title(result: object) -> str:
    """One-line title shown in the Checks panel header."""
    from gitowl.models import ReviewResult

    assert isinstance(result, ReviewResult)
    n = len(result.findings)
    risk = result.risk.value
    issues = f"{n} finding{'s' if n != 1 else ''}" if n else "No issues"
    return f"Risk: {risk} · {issues}"


def _post_check_run_best_effort(
    client: object,
    repo: str,
    sha: str,
    result: object,
    body: str,
) -> None:
    """Best-effort Check Run post — swallows errors so review always succeeds."""
    from gitowl.github_client import GitHubError

    try:
        client.post_check_run(  # type: ignore[attr-defined]
            repo=repo,
            sha=sha,
            conclusion=_risk_conclusion(result),
            title=_check_title(result),
            summary=body,  # full Markdown review shown in Details panel
        )
        print("Posted GitOwl check run.")
    except GitHubError as exc:
        logger.warning("Check Run post failed (non-fatal): %s", exc)


def _post_error(client: object, args: argparse.Namespace, pr_sha: str | None, msg: str) -> None:
    """Best-effort: post a branded error comment on the PR so it's visible."""
    from gitowl.github_client import GitHubError

    try:
        client.post_or_update_comment(args.repo, args.pr, render_error_comment(msg))  # type: ignore[attr-defined]
    except GitHubError:
        pass  # swallow — we're already in an error path

    # Also post a failing check run so the Checks section shows the error.
    if pr_sha:
        try:
            client.post_check_run(  # type: ignore[attr-defined]
                repo=args.repo,
                sha=pr_sha,
                conclusion="failure",
                title="GitOwl Review failed",
                summary=render_error_comment(msg),
            )
        except GitHubError:
            pass


def cmd_describe_diff(args: argparse.Namespace, config: Config) -> int:
    diff_text = _load_diff(args.file)
    if not diff_text.strip():
        print("Empty diff — nothing to describe.")
        return 0
    desc = describe_diff(diff_text, config)
    print(render_description(desc))
    return 0


def cmd_describe_pr(args: argparse.Namespace, config: Config) -> int:
    from gitowl.github_client import GitHubClient, GitHubError

    if not config.github_token:
        raise ConfigError("GITHUB_TOKEN is required for describe-pr.")
    client = GitHubClient(config.github_token)
    try:
        diff_text = client.fetch_pr_diff(args.repo, args.pr)
    except GitHubError as exc:
        logger.error("%s", exc)
        return 2

    if not diff_text.strip():
        print("Empty diff — nothing to describe.")
        return 0

    section = render_description(describe_diff(diff_text, config))
    if args.post:
        try:
            existing = client.fetch_pr_body(args.repo, args.pr)
            client.update_pr_body(args.repo, args.pr, merge_into_body(existing, section))
            print(f"Updated PR description on {args.repo}#{args.pr}")
        except GitHubError as exc:
            logger.error("%s", exc)
            return 2
    else:
        print(section)
    return 0


def cmd_providers(_args: argparse.Namespace, config: Config) -> int:
    print("Available AI providers:")
    for name in available_providers():
        marker = " (active)" if name == config.ai.provider else ""
        print(f"  - {name}{marker}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="gitowl",
        description="AI-assisted code review for GitHub pull requests.",
    )
    parser.add_argument("--version", action="version", version=f"GitOwl {__version__}")
    parser.add_argument(
        "--log-level",
        default=None,
        help="Override LOG_LEVEL (DEBUG/INFO/WARNING/ERROR).",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_diff = sub.add_parser("review-diff", help="Review a unified diff (file or stdin).")
    p_diff.add_argument("file", nargs="?", help="Path to diff file, or '-' for stdin.")
    p_diff.add_argument("--no-semgrep", action="store_true", help="Skip static analysis.")
    p_diff.set_defaults(func=cmd_review_diff)

    p_pr = sub.add_parser("review-pr", help="Review a GitHub PR by number.")
    p_pr.add_argument("repo", help="owner/repo, e.g. MarutiDubey/GitOwl")
    p_pr.add_argument("pr", type=int, help="Pull request number.")
    p_pr.add_argument("--post", action="store_true", help="Post the review as a PR comment.")
    p_pr.add_argument(
        "--suggest",
        action="store_true",
        help="Also post committable fixes as inline suggestions (needs --post).",
    )
    p_pr.add_argument("--no-semgrep", action="store_true", help="Skip static analysis.")
    p_pr.set_defaults(func=cmd_review_pr)

    p_desc = sub.add_parser("describe-diff", help="Generate a PR description for a diff.")
    p_desc.add_argument("file", nargs="?", help="Path to diff file, or '-' for stdin.")
    p_desc.set_defaults(func=cmd_describe_diff)

    p_desc_pr = sub.add_parser("describe-pr", help="Generate a PR description for a GitHub PR.")
    p_desc_pr.add_argument("repo", help="owner/repo, e.g. MarutiDubey/GitOwl")
    p_desc_pr.add_argument("pr", type=int, help="Pull request number.")
    p_desc_pr.add_argument(
        "--post", action="store_true", help="Write the description into the PR body."
    )
    p_desc_pr.set_defaults(func=cmd_describe_pr)

    p_prov = sub.add_parser("providers", help="List available AI providers.")
    p_prov.set_defaults(func=cmd_providers)

    return parser


def main(argv: list[str] | None = None) -> int:
    _force_utf8_output()
    parser = build_parser()
    args = parser.parse_args(argv)
    setup_logging(args.log_level)
    try:
        config = load_config()
        return int(args.func(args, config))
    except ConfigError as exc:
        logger.error("Configuration error: %s", exc)
        return 2
    except AIProviderError as exc:
        logger.error("AI provider error: %s", exc)
        return 3


if __name__ == "__main__":
    raise SystemExit(main())
