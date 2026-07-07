"""Optional usage-metrics push to an external dashboard.

Best-effort only: failures are logged and swallowed, never raised, so a
dashboard outage can't break the GitHub review/comment flow.
"""

from __future__ import annotations

import dataclasses
import logging
import os

import httpx

from gitowl.config import Config
from gitowl.models import ReviewResult, Severity

logger = logging.getLogger(__name__)

_TIMEOUT = 5.0


class PolicyDisabled(Exception):
    """Raised when the dashboard says review is disabled for this repo (403)."""


def fetch_policy_override(repo: str, config: Config) -> Config:
    """Fetch a per-repo policy override from ``GITOWL_DASHBOARD_URL`` if set.

    - 200: merge JSON fields (min_severity, ignore_paths, ai_model) onto config.
    - 404/500/network error: silently fall back to local .gitowl.toml (``config``).
    - 403: raise PolicyDisabled — caller should abort the review early.
    """
    url = os.environ.get("GITOWL_DASHBOARD_URL")
    if not url:
        return config

    try:
        resp = httpx.get(f"{url}/api/policy", params={"repo": repo}, timeout=_TIMEOUT)
    except httpx.HTTPError as exc:
        logger.warning("Dashboard policy fetch failed (using local .gitowl.toml): %s", exc)
        return config

    if resp.status_code == 403:
        raise PolicyDisabled(f"Review disabled for {repo} via dashboard policy.")

    if resp.status_code != 200:
        logger.warning(
            "Dashboard policy fetch returned %s (using local .gitowl.toml)", resp.status_code
        )
        return config

    try:
        data = resp.json()
    except ValueError:
        logger.warning("Dashboard policy response was not valid JSON (ignored).")
        return config

    policy = config.policy
    if "min_severity" in data:
        try:
            policy = dataclasses.replace(policy, min_severity=Severity(data["min_severity"]))
        except ValueError:
            logger.warning("Dashboard sent unknown min_severity %r (ignored).", data["min_severity"])
    if "ignore_paths" in data:
        policy = dataclasses.replace(policy, ignore_paths=tuple(data["ignore_paths"]))

    ai = config.ai
    if "ai_model" in data:
        ai = dataclasses.replace(ai, model=data["ai_model"])

    logger.info("Applied dashboard policy override for %s", repo)
    return dataclasses.replace(config, ai=ai, policy=policy)


def send_usage_metrics(repo: str, pr_number: int, result: ReviewResult) -> None:
    """POST usage metrics to ``GITOWL_DASHBOARD_URL`` if set. Never raises."""
    url = os.environ.get("GITOWL_DASHBOARD_URL")
    if not url:
        return

    usage = result.usage
    payload = {
        "repo": repo,
        "pr_number": pr_number,
        "risk": result.risk.value,
        "prompt_tokens": usage.prompt_tokens if usage else None,
        "completion_tokens": usage.completion_tokens if usage else None,
        "total_tokens": usage.total_tokens if usage else None,
        "estimated_cost_usd": usage.estimated_cost_usd if usage else None,
        "latency_ms": usage.latency_ms if usage else None,
        "model": usage.model if usage else None,
    }

    try:
        httpx.post(url, json=payload, timeout=_TIMEOUT)
    except httpx.HTTPError as exc:
        logger.warning("Dashboard metrics POST failed (ignored): %s", exc)
