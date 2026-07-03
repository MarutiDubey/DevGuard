"""Runtime configuration loaded from environment (.env) and `.devguard.toml`.

Precedence, lowest to highest: built-in defaults < `.devguard.toml` (repo policy)
< environment variables (per-run/CI overrides). The repo file sets project-wide
policy; a CI secret or shell export can always override it for a single run.
"""

from __future__ import annotations

import os
import tomllib
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

from devguard.models import Severity

# Load .env once at import time. Values already set in the real environment win.
load_dotenv(override=False)

# Repo-level config file, looked up relative to the current working directory.
CONFIG_FILENAME = ".devguard.toml"


class ConfigError(RuntimeError):
    """Raised when required configuration is missing or invalid."""


@dataclass(frozen=True)
class AIConfig:
    """Configuration for the AI provider layer."""

    provider: str
    model: str
    base_url: str | None
    api_key: str | None


@dataclass(frozen=True)
class ReviewPolicy:
    """Repo-tunable review policy (from the ``[review]`` table of the toml file).

    Defaults preserve the pre-config behaviour: report every finding, ignore
    nothing.
    """

    min_severity: Severity = Severity.INFO
    ignore_paths: tuple[str, ...] = ()


@dataclass(frozen=True)
class Config:
    """Top-level DevGuard configuration."""

    ai: AIConfig
    github_token: str | None
    semgrep_timeout_seconds: int
    max_diff_lines: int
    log_level: str
    policy: ReviewPolicy = field(default_factory=ReviewPolicy)
    # Per-repo model price overrides from [pricing]: model -> (input, output) per 1M tokens.
    pricing_overrides: dict[str, tuple[float, float]] = field(default_factory=dict)


def _get_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return int(raw)
    except ValueError as exc:  # pragma: no cover - defensive
        raise ConfigError(f"{name} must be an integer, got {raw!r}") from exc


def _load_toml(config_path: Path | None) -> dict:
    """Read the `.devguard.toml` file, or return {} when it's absent.

    ``config_path`` defaults to ``./.devguard.toml``. A missing file is fine
    (config is optional); malformed TOML is a hard error.
    """
    path = config_path if config_path is not None else Path.cwd() / CONFIG_FILENAME
    if not path.is_file():
        return {}
    try:
        with path.open("rb") as handle:
            return tomllib.load(handle)
    except tomllib.TOMLDecodeError as exc:
        raise ConfigError(f"invalid TOML in {path}: {exc}") from exc


def _severity_from_str(raw: str) -> Severity:
    """Map an 'info'/'warning'/'error' string to a Severity (case-insensitive)."""
    try:
        return Severity(raw.strip().lower())
    except ValueError as exc:
        allowed = ", ".join(s.value for s in Severity)
        raise ConfigError(f"min_severity must be one of {allowed}, got {raw!r}") from exc


def _review_policy(toml_data: dict) -> ReviewPolicy:
    """Build a ReviewPolicy from the ``[review]`` table (defaults when absent)."""
    review = toml_data.get("review", {})
    if not isinstance(review, dict):
        raise ConfigError("[review] must be a table")

    min_severity = ReviewPolicy.min_severity
    if "min_severity" in review:
        min_severity = _severity_from_str(str(review["min_severity"]))

    ignore_paths = ReviewPolicy.ignore_paths
    if "ignore_paths" in review:
        raw_paths = review["ignore_paths"]
        if not isinstance(raw_paths, list) or not all(isinstance(p, str) for p in raw_paths):
            raise ConfigError("ignore_paths must be a list of strings")
        ignore_paths = tuple(raw_paths)

    return ReviewPolicy(min_severity=min_severity, ignore_paths=ignore_paths)


def _pricing_overrides(toml_data: dict) -> dict[str, tuple[float, float]]:
    """Parse the ``[pricing]`` table into a model -> (input, output) map.

    Each entry is ``"<model>" = [input_per_1m, output_per_1m]`` (two numbers).
    An empty/absent table yields ``{}`` (built-in prices are used as-is).
    """
    pricing = toml_data.get("pricing", {})
    if not isinstance(pricing, dict):
        raise ConfigError("[pricing] must be a table")

    overrides: dict[str, tuple[float, float]] = {}
    for model, raw in pricing.items():
        if (
            not isinstance(raw, list)
            or len(raw) != 2
            or not all(isinstance(n, int | float) and not isinstance(n, bool) for n in raw)
        ):
            raise ConfigError(
                f"pricing for {model!r} must be [input_per_1m, output_per_1m] numbers"
            )
        overrides[model] = (float(raw[0]), float(raw[1]))
    return overrides


def load_config(config_path: Path | None = None) -> Config:
    """Build a Config from `.devguard.toml` and the environment.

    Precedence (low to high): defaults < toml file < environment variables.
    ``config_path`` overrides the default `./.devguard.toml` lookup (used by tests).
    """
    toml_data = _load_toml(config_path)
    toml_ai = toml_data.get("ai", {})
    if not isinstance(toml_ai, dict):
        raise ConfigError("[ai] must be a table")

    provider = (
        (os.getenv("AI_PROVIDER") or str(toml_ai.get("provider", "openrouter"))).strip().lower()
    )
    model = os.getenv("AI_MODEL") or toml_ai.get("model") or "openai/gpt-4o-mini"
    ai = AIConfig(
        provider=provider,
        model=model,
        base_url=os.getenv("AI_BASE_URL") or toml_ai.get("base_url") or None,
        api_key=os.getenv("AI_API_KEY") or None,
    )
    return Config(
        ai=ai,
        github_token=os.getenv("GITHUB_TOKEN") or None,
        semgrep_timeout_seconds=_get_int("SEMGREP_TIMEOUT_SECONDS", 60),
        max_diff_lines=_get_int("MAX_DIFF_LINES", 2000),
        log_level=os.getenv("LOG_LEVEL", "INFO"),
        policy=_review_policy(toml_data),
        pricing_overrides=_pricing_overrides(toml_data),
    )
