"""Model pricing and cost estimation for AI review calls.

Prices are USD per 1,000,000 tokens, quoted as ``(input, output)`` — the two
sides most providers bill separately. The built-in table below is a convenience
default for the common models; a repo can override or extend it via the
``[pricing]`` table in ``.devguard.toml`` (see :mod:`devguard.config`).

Estimation is best-effort: an unknown model yields ``None`` cost rather than a
wrong number, and the caller surfaces "cost unknown" instead of guessing.
"""

from __future__ import annotations

from devguard.logging_config import get_logger

logger = get_logger(__name__)

# USD per 1,000,000 tokens, as (input_price, output_price).
# Kept small and current-ish; override per-repo via [pricing] when needed.
DEFAULT_PRICING: dict[str, tuple[float, float]] = {
    "openai/gpt-4o-mini": (0.15, 0.60),
    "openai/gpt-4o": (2.50, 10.00),
    "gpt-4o-mini": (0.15, 0.60),
    "gpt-4o": (2.50, 10.00),
    "anthropic/claude-3.5-sonnet": (3.00, 15.00),
    "anthropic/claude-3-haiku": (0.25, 1.25),
}

_PER_TOKEN_DIVISOR = 1_000_000


def _normalize(model: str) -> str:
    return model.strip().lower()


class PricingTable:
    """A model → (input, output) price lookup with optional repo overrides.

    Built from :data:`DEFAULT_PRICING`, then any entries from the repo's
    ``[pricing]`` table are layered on top (override wins). Lookups are
    case-insensitive.
    """

    def __init__(self, overrides: dict[str, tuple[float, float]] | None = None) -> None:
        merged = {_normalize(k): v for k, v in DEFAULT_PRICING.items()}
        if overrides:
            merged.update({_normalize(k): v for k, v in overrides.items()})
        self._prices = merged

    def price_for(self, model: str) -> tuple[float, float] | None:
        """Return ``(input, output)`` price per 1M tokens, or ``None`` if unknown."""
        return self._prices.get(_normalize(model))

    def estimate_cost(
        self, model: str, prompt_tokens: int, completion_tokens: int
    ) -> float | None:
        """Estimate the USD cost of a call, or ``None`` when the model is unpriced.

        Input and output tokens are billed at their separate rates.
        """
        price = self.price_for(model)
        if price is None:
            logger.info("No pricing for model %r; cost estimate unavailable.", model)
            return None
        input_price, output_price = price
        cost = (
            prompt_tokens * input_price + completion_tokens * output_price
        ) / _PER_TOKEN_DIVISOR
        return round(cost, 6)


def default_pricing_table() -> PricingTable:
    """A :class:`PricingTable` with no repo overrides (built-in prices only)."""
    return PricingTable()
