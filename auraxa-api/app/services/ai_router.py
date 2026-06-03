"""
AI Router — Multi-Provider Fallback System
==========================================
Tries providers in priority order. If one fails (rate limit, quota,
timeout, server error), automatically falls over to the next.

Supports:
  1. OpenRouter  → GPT-4o-mini / GPT-4o
  2. Google Gemini → gemini-2.0-flash / gemini-1.5-pro
  3. NVIDIA NIM  → llama-3.1-70b-instruct

All three expose OpenAI-compatible /chat/completions endpoints,
so the same httpx call works for every provider.

Usage:
    from app.services.ai_router import ai_router

    content, provider = await ai_router.complete(
        messages=[...],
        model_type="analysis",
        temperature=0.3,
        max_tokens=2000,
    )
"""

import time
import logging
import httpx
from dataclasses import dataclass, field
from typing import Literal, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# HTTP status codes that trigger a provider failover
FAILOVER_CODES = {401, 402, 429, 500, 502, 503, 504}


@dataclass
class ProviderConfig:
    name: str
    base_url: str
    api_key: str
    analysis_model: str
    advisor_model: str
    vision_model: str
    supports_vision: bool = True


@dataclass
class ProviderHealth:
    status: str = "unknown"      # healthy | degraded | down | unknown
    last_used: float = 0.0
    last_error: str = ""
    success_count: int = 0
    failure_count: int = 0
    total_latency_ms: float = 0.0

    @property
    def avg_latency_ms(self) -> float:
        if self.success_count == 0:
            return 0.0
        return round(self.total_latency_ms / self.success_count, 1)


def _build_providers() -> list[ProviderConfig]:
    """Build provider list from config — only include providers with keys set."""
    all_providers = {
        "openrouter": ProviderConfig(
            name="openrouter",
            base_url=settings.OPENROUTER_BASE_URL,
            api_key=settings.OPENROUTER_API_KEY,
            analysis_model=settings.OPENROUTER_ANALYSIS_MODEL,
            advisor_model=settings.OPENROUTER_ADVISOR_MODEL,
            vision_model=settings.OPENROUTER_VISION_MODEL,
            supports_vision=True,
        ),
        "gemini": ProviderConfig(
            name="gemini",
            base_url=settings.GEMINI_BASE_URL,
            api_key=settings.GEMINI_API_KEY,
            analysis_model=settings.GEMINI_ANALYSIS_MODEL,
            advisor_model=settings.GEMINI_ADVISOR_MODEL,
            vision_model=settings.GEMINI_VISION_MODEL,
            supports_vision=True,
        ),
        "nvidia": ProviderConfig(
            name="nvidia",
            base_url=settings.NVIDIA_BASE_URL,
            api_key=settings.NVIDIA_API_KEY,
            analysis_model=settings.NVIDIA_ANALYSIS_MODEL,
            advisor_model=settings.NVIDIA_ADVISOR_MODEL,
            vision_model=settings.NVIDIA_VISION_MODEL,
            supports_vision=True,
        ),
    }

    ordered = []
    for name in settings.get_provider_priority():
        provider = all_providers.get(name)
        if provider and provider.api_key:
            ordered.append(provider)

    if not ordered:
        raise RuntimeError(
            "No AI provider keys configured. Set at least one of: "
            "OPENROUTER_API_KEY, GEMINI_API_KEY, NVIDIA_API_KEY in .env"
        )

    return ordered


class AIRouter:
    """
    Multi-provider AI router with automatic failover.
    Maintains in-memory health state for each provider.
    """

    def __init__(self):
        self._providers: list[ProviderConfig] = []
        self._health: dict[str, ProviderHealth] = {}
        self._initialized = False

    def _ensure_init(self):
        if not self._initialized:
            self._providers = _build_providers()
            self._health = {p.name: ProviderHealth() for p in self._providers}
            self._initialized = True
            logger.info(
                f"AI Router initialised with {len(self._providers)} provider(s): "
                f"{[p.name for p in self._providers]}"
            )

    def _get_model(
        self,
        provider: ProviderConfig,
        model_type: Literal["analysis", "advisor", "vision"],
    ) -> str:
        if model_type == "analysis":
            return provider.analysis_model
        if model_type == "advisor":
            return provider.advisor_model
        return provider.vision_model

    def _get_headers(self, provider: ProviderConfig) -> dict:
        headers = {
            "Authorization": f"Bearer {provider.api_key}",
            "Content-Type": "application/json",
        }
        if provider.name == "openrouter":
            headers["HTTP-Referer"] = "https://auraxa.app"
            headers["X-Title"] = "Auraxa"
        return headers

    async def _call_provider(
        self,
        provider: ProviderConfig,
        messages: list[dict],
        model_type: Literal["analysis", "advisor", "vision"],
        temperature: float,
        max_tokens: int,
    ) -> str:
        model = self._get_model(provider, model_type)
        url = f"{provider.base_url.rstrip('/')}/chat/completions"

        start = time.time()
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                url,
                headers=self._get_headers(provider),
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            response.raise_for_status()
            data = response.json()

        latency_ms = (time.time() - start) * 1000
        content = data["choices"][0]["message"]["content"].strip()
        usage = data.get("usage", {})

        # Record success
        h = self._health[provider.name]
        h.status = "healthy"
        h.last_used = time.time()
        h.success_count += 1
        h.total_latency_ms += latency_ms

        logger.info(
            f"[ai_router] ✓ {provider.name}/{model} "
            f"— {round(latency_ms)}ms"
        )
        return content, usage

    async def complete(
        self,
        messages: list[dict],
        model_type: Literal["analysis", "advisor", "vision"] = "analysis",
        temperature: float = 0.3,
        max_tokens: int = 2000,
        vision_only: bool = False,
    ) -> tuple[str, str]:
        """
        Call AI with automatic failover.
        Returns (content, provider_name).
        Raises ValueError if all providers fail.
        """
        self._ensure_init()

        providers = self._providers
        if vision_only:
            providers = [p for p in providers if p.supports_vision]

        last_error: Optional[Exception] = None

        for provider in providers:
            try:
                content, usage = await self._call_provider(
                    provider, messages, model_type, temperature, max_tokens
                )
                return content, provider.name, usage

            except httpx.HTTPStatusError as e:
                code = e.response.status_code
                err_msg = f"HTTP {code}"
                self._record_failure(provider.name, err_msg)

                if code in FAILOVER_CODES:
                    logger.warning(
                        f"[ai_router] ✗ {provider.name} failed ({code}) "
                        f"— trying next provider"
                    )
                    last_error = e
                    continue
                # Non-failover HTTP error — still try next
                logger.warning(f"[ai_router] ✗ {provider.name} error ({code}) — trying next")
                last_error = e
                continue

            except (httpx.TimeoutException, httpx.ConnectError) as e:
                self._record_failure(provider.name, "timeout/connect")
                logger.warning(
                    f"[ai_router] ✗ {provider.name} timeout/connect — trying next provider"
                )
                last_error = e
                continue

            except Exception as e:
                self._record_failure(provider.name, str(e)[:100])
                logger.error(f"[ai_router] ✗ {provider.name} unexpected error: {e}")
                last_error = e
                continue

        raise ValueError(
            f"All {len(providers)} AI provider(s) failed. "
            f"Last error: {last_error}. "
            f"Check your API keys and credits."
        )

    def _record_failure(self, name: str, error: str):
        if name not in self._health:
            return
        h = self._health[name]
        h.failure_count += 1
        h.last_error = error
        h.status = "down" if h.failure_count >= 3 else "degraded"

    def get_health(self) -> dict:
        """Return health status of all configured providers."""
        self._ensure_init()
        return {
            name: {
                "status": h.status,
                "model_analysis": next(
                    (p.analysis_model for p in self._providers if p.name == name), "—"
                ),
                "model_advisor": next(
                    (p.advisor_model for p in self._providers if p.name == name), "—"
                ),
                "success_count": h.success_count,
                "failure_count": h.failure_count,
                "avg_latency_ms": h.avg_latency_ms,
                "last_error": h.last_error or None,
                "last_used": round(h.last_used) if h.last_used else None,
            }
            for name, h in self._health.items()
        }

    def get_active_provider_names(self) -> list[str]:
        self._ensure_init()
        return [p.name for p in self._providers]


# Global singleton
ai_router = AIRouter()
