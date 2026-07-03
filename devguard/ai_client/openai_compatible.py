"""Provider for any OpenAI-compatible chat-completions API.

OpenRouter and OpenAI both speak this protocol, so they share this base and
differ only in default base URL and required headers.
"""

from __future__ import annotations

import time

import httpx

from devguard.ai_client.base import AIProvider, AIProviderError
from devguard.ai_client.prompt import SYSTEM_PROMPT, build_user_prompt, parse_review_response
from devguard.logging_config import get_logger
from devguard.models import Finding, ReviewResult, UsageStats

logger = get_logger(__name__)

_REQUEST_TIMEOUT_SECONDS = 120.0


class OpenAICompatibleProvider(AIProvider):
    """Base class talking the ``/chat/completions`` protocol."""

    #: Default API base URL when none is configured.
    default_base_url: str = "https://api.openai.com/v1"
    #: Whether a valid API key is required (Ollama, e.g., does not need one).
    requires_api_key: bool = True

    def _base_url(self) -> str:
        return (self.config.base_url or self.default_base_url).rstrip("/")

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.config.api_key:
            headers["Authorization"] = f"Bearer {self.config.api_key}"
        return headers

    def review(self, diff: str, findings: list[Finding]) -> ReviewResult:
        if self.requires_api_key and not self.config.api_key:
            raise AIProviderError(
                f"Provider '{self.name}' requires an API key. Set AI_API_KEY in .env."
            )

        payload = {
            "model": self.config.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": build_user_prompt(diff, findings)},
            ],
            "temperature": 0.1,
        }

        url = f"{self._base_url()}/chat/completions"
        logger.info("Requesting review from %s model=%s", self.name, self.config.model)
        start = time.perf_counter()
        try:
            response = httpx.post(
                url,
                headers=self._headers(),
                json=payload,
                timeout=_REQUEST_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise AIProviderError(
                f"{self.name} API returned {exc.response.status_code}: "
                f"{exc.response.text[:300]}"
            ) from exc
        except httpx.HTTPError as exc:
            raise AIProviderError(f"{self.name} request failed: {exc}") from exc
        latency_ms = int((time.perf_counter() - start) * 1000)

        try:
            body = response.json()
            content = body["choices"][0]["message"]["content"]
        except (KeyError, IndexError, ValueError) as exc:
            raise AIProviderError(f"{self.name} returned an unexpected response shape") from exc

        try:
            result = parse_review_response(content, findings)
        except (ValueError, KeyError) as exc:
            raise AIProviderError(f"Could not parse {self.name} review JSON: {exc}") from exc

        # Cost is left None here; the reviewer applies the pricing table (which
        # knows the repo's [pricing] overrides) once it has the token counts.
        result.usage = self._usage_from(body.get("usage"), latency_ms)
        return result

    def _usage_from(self, usage: object, latency_ms: int) -> UsageStats:
        """Build a :class:`UsageStats` from the API's ``usage`` block (if present)."""
        raw = usage if isinstance(usage, dict) else {}

        def _as_int(key: str) -> int:
            value = raw.get(key)
            return value if isinstance(value, int) and not isinstance(value, bool) else 0

        prompt_tokens = _as_int("prompt_tokens")
        completion_tokens = _as_int("completion_tokens")
        total_tokens = _as_int("total_tokens") or (prompt_tokens + completion_tokens)
        return UsageStats(
            model=self.config.model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            latency_ms=latency_ms,
        )


class OpenRouterProvider(OpenAICompatibleProvider):
    """OpenRouter — a single key fronting many models."""

    name = "openrouter"
    default_base_url = "https://openrouter.ai/api/v1"
    requires_api_key = True

    def _headers(self) -> dict[str, str]:
        headers = super()._headers()
        # Optional attribution headers recommended by OpenRouter.
        headers["HTTP-Referer"] = "https://github.com/MarutiDubey/DevGuard"
        headers["X-Title"] = "DevGuard"
        return headers


class OpenAIProvider(OpenAICompatibleProvider):
    """OpenAI's hosted API."""

    name = "openai"
    default_base_url = "https://api.openai.com/v1"
    requires_api_key = True
