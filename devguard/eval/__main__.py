"""Eval harness CLI: ``python -m devguard.eval``.

Runs the seeded-bug corpus through DevGuard and reports precision/recall/F1.

  python -m devguard.eval                     # mock provider (offline, no key)
  python -m devguard.eval --live              # real provider from .env
  python -m devguard.eval --json              # machine-readable output
  python -m devguard.eval --fail-under 0.9    # exit non-zero if F1 below 0.9
  python -m devguard.eval --cases path/to/dir # custom corpus
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from devguard.config import AIConfig, Config, load_config
from devguard.eval import CASES_DIR, run_eval
from devguard.eval.scoring import EvalReport, Metrics
from devguard.logging_config import get_logger, setup_logging

logger = get_logger(__name__)


def _force_utf8_output() -> None:
    """Ensure stdout/stderr can emit UTF-8 (Windows consoles default to cp1252)."""
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if callable(reconfigure):
            try:
                reconfigure(encoding="utf-8", errors="replace")
            except (ValueError, OSError):  # pragma: no cover
                pass


def _mock_config() -> Config:
    """A config whose provider is the deterministic eval mock (no key needed)."""
    return Config(
        ai=AIConfig(
            provider="eval-mock",
            model="mock",
            base_url="http://localhost",
            api_key="none",
        ),
        github_token=None,
        semgrep_timeout_seconds=60,
        max_diff_lines=2000,
        log_level="INFO",
    )


def _r4(value: float) -> float:
    """Round a metric to 4 dp so JSON output is clean and stable."""
    return round(value, 4)


def _report_to_json(report: EvalReport) -> dict:
    return {
        "cases": [
            {
                "name": c.name,
                "tp": c.match.tp,
                "fp": c.match.fp,
                "fn": c.match.fn,
                "precision": _r4(c.metrics.precision),
                "recall": _r4(c.metrics.recall),
                "f1": _r4(c.metrics.f1),
            }
            for c in report.cases
        ],
        "aggregate": {
            "tp": sum(c.match.tp for c in report.cases),
            "fp": sum(c.match.fp for c in report.cases),
            "fn": sum(c.match.fn for c in report.cases),
            "precision": _r4(report.aggregate.precision),
            "recall": _r4(report.aggregate.recall),
            "f1": _r4(report.aggregate.f1),
        },
    }


def _print_human(report: EvalReport) -> None:
    print("DevGuard eval — seeded-bug precision/recall\n")
    header = f"{'case':<22} {'TP':>3} {'FP':>3} {'FN':>3}  {'prec':>6} {'rec':>6} {'F1':>6}"
    print(header)
    print("-" * len(header))
    for c in report.cases:
        m = c.metrics
        print(
            f"{c.name:<22} {c.match.tp:>3} {c.match.fp:>3} {c.match.fn:>3}  "
            f"{m.precision:>6.3f} {m.recall:>6.3f} {m.f1:>6.3f}"
        )
    print("-" * len(header))
    agg: Metrics = report.aggregate
    tp = sum(c.match.tp for c in report.cases)
    fp = sum(c.match.fp for c in report.cases)
    fn = sum(c.match.fn for c in report.cases)
    print(
        f"{'AGGREGATE':<22} {tp:>3} {fp:>3} {fn:>3}  "
        f"{agg.precision:>6.3f} {agg.recall:>6.3f} {agg.f1:>6.3f}"
    )


def main(argv: list[str] | None = None) -> int:
    _force_utf8_output()
    parser = argparse.ArgumentParser(
        prog="devguard.eval",
        description="Score DevGuard against a seeded-bug corpus (precision/recall).",
    )
    parser.add_argument(
        "--live",
        action="store_true",
        help="Use the real provider from .env instead of the offline mock.",
    )
    parser.add_argument(
        "--cases",
        type=Path,
        default=CASES_DIR,
        help="Directory of <name>.diff + <name>.expected.json cases.",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON output.")
    parser.add_argument(
        "--fail-under",
        type=float,
        default=None,
        metavar="F1",
        help="Exit non-zero if aggregate F1 is below this threshold.",
    )
    args = parser.parse_args(argv)
    setup_logging(None)

    config = load_config() if args.live else _mock_config()
    if args.live:
        logger.info("eval mode: live (provider=%s)", config.ai.provider)
    else:
        logger.info("eval mode: mock")

    report = run_eval(args.cases, config)

    if args.json:
        print(json.dumps(_report_to_json(report), indent=2))
    else:
        _print_human(report)

    if args.fail_under is not None and report.aggregate.f1 < args.fail_under:
        logger.error(
            "aggregate F1 %.4f is below --fail-under %.4f",
            report.aggregate.f1,
            args.fail_under,
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
