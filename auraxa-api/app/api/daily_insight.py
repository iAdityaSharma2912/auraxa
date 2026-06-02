from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import json
import logging
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.ai_router import ai_router

router = APIRouter()
logger = logging.getLogger(__name__)


def _get_redis():
    import redis as redis_lib
    from app.core.config import settings
    return redis_lib.from_url(settings.REDIS_URL, decode_responses=True)


def _today_key() -> str:
    """Redis key scoped to today's date — auto-invalidates at midnight."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"auraxa:daily_insight:{today}"


SYSTEM_PROMPT = """You are Auraxa's cosmic intelligence engine — a fusion of astrology, 
numerology, and emotional wisdom. Generate today's cosmic daily insight.

Return ONLY a valid JSON object, no markdown, no preamble:

{
  "energy_level": <integer 30-95>,
  "energy_label": "<one evocative word: Expansive / Reflective / Grounding / Magnetic / Transformative / Luminous / Intense / Fluid / Crystalline / Awakened>",
  "energy_note": "<one sentence of practical cosmic guidance for today, max 12 words>",
  "insight": "<one astrological sentence about today's planetary energy, max 18 words>",
  "guidance": "<one deeper piece of wisdom for relationships and emotional intelligence today, max 20 words>",
  "dominant_element": "<Fire / Water / Earth / Air>",
  "moon_phase": "<New Moon / Waxing Crescent / First Quarter / Waxing Gibbous / Full Moon / Waning Gibbous / Last Quarter / Waning Crescent>",
  "power_hour": "<a time range like '6–8 AM' or '9–11 PM' when energy peaks today>"
}"""


def _user_prompt() -> str:
    now = datetime.now(timezone.utc)
    return (
        f"Today is {now.strftime('%A, %B %d, %Y')}. "
        f"Current UTC time: {now.strftime('%H:%M')}. "
        "Generate a unique and accurate cosmic daily insight for Auraxa users. "
        "Make it feel genuinely astrological and emotionally resonant — not generic."
    )


async def _generate_insight() -> dict:
    """Call AI to generate today's insight."""
    content, provider = await ai_router.complete(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": _user_prompt()},
        ],
        model_type="analysis",
        temperature=0.75,
        max_tokens=400,
    )
    logger.info(f"Daily insight generated via {provider}")

    # Strip markdown fences if present
    content = content.strip()
    if "```" in content:
        for part in content.split("```"):
            part = part.strip().lstrip("json").strip()
            if part.startswith("{"):
                content = part
                break

    start = content.find("{")
    end   = content.rfind("}") + 1
    if start != -1 and end > start:
        content = content[start:end]

    return json.loads(content)


def _fallback_insight() -> dict:
    """Static fallback if AI call fails — cycles by day of month."""
    day = datetime.now(timezone.utc).day
    FALLBACKS = [
        {
            "energy_level": 78, "energy_label": "Magnetic",
            "energy_note": "Strong attraction energy today. Connections feel heightened.",
            "insight": "Venus trine Jupiter amplifies emotional intelligence today.",
            "guidance": "Trust your instincts in conversations. Meaning flows beneath words.",
            "dominant_element": "Air", "moon_phase": "Waxing Gibbous", "power_hour": "7–9 PM",
        },
        {
            "energy_level": 62, "energy_label": "Reflective",
            "energy_note": "Introspective energy. Seek clarity before acting.",
            "insight": "Mercury retrograde asks you to review past patterns with fresh eyes.",
            "guidance": "Listen more than you speak. Hidden truths surface in silence.",
            "dominant_element": "Water", "moon_phase": "Last Quarter", "power_hour": "6–8 AM",
        },
        {
            "energy_level": 85, "energy_label": "Expansive",
            "energy_note": "High receptivity today. Good for deep conversations.",
            "insight": "Jupiter direct restores optimism and forward momentum today.",
            "guidance": "Open yourself to unexpected emotional depth in familiar connections.",
            "dominant_element": "Fire", "moon_phase": "Full Moon", "power_hour": "8–10 PM",
        },
        {
            "energy_level": 55, "energy_label": "Grounding",
            "energy_note": "Earth energy dominant. Focus on what is real.",
            "insight": "Saturn's influence asks for patience and structural clarity.",
            "guidance": "Ground your emotions before responding. Stability is magnetic.",
            "dominant_element": "Earth", "moon_phase": "New Moon", "power_hour": "10 AM–12 PM",
        },
        {
            "energy_level": 91, "energy_label": "Transformative",
            "energy_note": "Powerful shift incoming. Trust the changes unfolding.",
            "insight": "Pluto sextile Moon deepens emotional transformation significantly.",
            "guidance": "What you release today creates space for something profound.",
            "dominant_element": "Water", "moon_phase": "Waning Gibbous", "power_hour": "11 PM–1 AM",
        },
    ]
    return FALLBACKS[day % len(FALLBACKS)]


@router.get("/daily-insight")
async def get_daily_insight(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns today's AI-generated cosmic insight.
    Cached in Redis for 24 hours — generated fresh once per day per deployment.
    """
    key = _today_key()

    # ── Try Redis cache first ──────────────────────────────
    try:
        r      = _get_redis()
        cached = r.get(key)
        if cached:
            logger.info("Daily insight served from cache")
            return json.loads(cached)
    except Exception as e:
        logger.warning(f"Redis read failed: {e}")

    # ── Generate fresh insight ─────────────────────────────
    try:
        insight = await _generate_insight()
    except Exception as e:
        logger.error(f"AI insight generation failed: {e}")
        insight = _fallback_insight()

    # ── Cache until end of day (Redis TTL = seconds until midnight UTC) ──
    try:
        now          = datetime.now(timezone.utc)
        midnight     = now.replace(hour=0, minute=0, second=0, microsecond=0)
        from datetime import timedelta
        next_midnight = midnight + timedelta(days=1)
        ttl          = int((next_midnight - now).total_seconds())

        r = _get_redis()
        r.setex(key, ttl, json.dumps(insight))
        logger.info(f"Daily insight cached for {ttl}s (until midnight UTC)")
    except Exception as e:
        logger.warning(f"Redis write failed: {e}")

    return insight
