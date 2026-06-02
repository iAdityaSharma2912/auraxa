"""
Astrology Service — Phase 4
----------------------------
Uses ai_router for automatic provider failover.
"""

import json
import logging
from datetime import date
from app.services.ai_router import ai_router

logger = logging.getLogger(__name__)

SIGNS = [
    ("Capricorn",   (1,  1),  (1,  19)),
    ("Aquarius",    (1,  20), (2,  18)),
    ("Pisces",      (2,  19), (3,  20)),
    ("Aries",       (3,  21), (4,  19)),
    ("Taurus",      (4,  20), (5,  20)),
    ("Gemini",      (5,  21), (6,  20)),
    ("Cancer",      (6,  21), (7,  22)),
    ("Leo",         (7,  23), (8,  22)),
    ("Virgo",       (8,  23), (9,  22)),
    ("Libra",       (9,  23), (10, 22)),
    ("Scorpio",     (10, 23), (11, 21)),
    ("Sagittarius", (11, 22), (12, 21)),
    ("Capricorn",   (12, 22), (12, 31)),
]

SIGN_ELEMENTS = {
    "Aries": "Fire",    "Leo": "Fire",    "Sagittarius": "Fire",
    "Taurus": "Earth",  "Virgo": "Earth", "Capricorn": "Earth",
    "Gemini": "Air",    "Libra": "Air",   "Aquarius": "Air",
    "Cancer": "Water",  "Scorpio": "Water","Pisces": "Water",
}

SIGN_MODALITIES = {
    "Aries": "Cardinal", "Cancer": "Cardinal", "Libra": "Cardinal",   "Capricorn": "Cardinal",
    "Taurus": "Fixed",   "Leo": "Fixed",       "Scorpio": "Fixed",    "Aquarius": "Fixed",
    "Gemini": "Mutable", "Virgo": "Mutable",   "Sagittarius": "Mutable", "Pisces": "Mutable",
}


def get_sun_sign(dob: str) -> str:
    try:
        d = date.fromisoformat(dob)
        m, day = d.month, d.day
        for sign, (sm, sd), (em, ed) in SIGNS:
            if (m == sm and day >= sd) or (m == em and day <= ed):
                return sign
    except Exception:
        pass
    return "Unknown"


CHART_SYSTEM = """You are Auraxa's astrology AI. Return ONLY a valid JSON object for a birth chart analysis.

{
  "sun_sign": "...",
  "element": "...",
  "modality": "...",
  "personality_summary": "3-4 sentences",
  "emotional_style": "2-3 sentences",
  "communication_style": "2-3 sentences",
  "relationship_patterns": "2-3 sentences",
  "strengths": ["3-4 relationship strengths"],
  "challenges": ["3-4 shadow traits or challenges"],
  "compatibility_notes": "2-3 sentences on compatible signs",
  "guidance": "1-2 sentences of actionable relationship guidance"
}"""

COMPAT_SYSTEM = """You are Auraxa's astrology AI. Return ONLY a valid JSON object for compatibility analysis.

{
  "person_a_sign": "...",
  "person_b_sign": "...",
  "compatibility_score": <integer 0-100>,
  "overall_dynamic": "3-4 sentences",
  "strengths": ["3-4 compatibility strengths"],
  "challenges": ["3-4 compatibility challenges"],
  "communication_compatibility": "2-3 sentences",
  "emotional_compatibility": "2-3 sentences",
  "guidance": "2-3 sentences of actionable guidance"
}"""


def _parse_json(content: str) -> dict:
    content = content.strip()
    if "```" in content:
        for part in content.split("```"):
            part = part.strip().lstrip("json").strip()
            if part.startswith("{"):
                content = part
                break
    start = content.find("{")
    end = content.rfind("}") + 1
    if start != -1 and end > start:
        content = content[start:end]
    return json.loads(content)


async def analyze_birth_chart(
    dob: str,
    name: str = "Person",
    birth_time: str | None = None,
    birthplace: str | None = None,
) -> dict:
    sun_sign = get_sun_sign(dob)
    element  = SIGN_ELEMENTS.get(sun_sign, "Unknown")
    modality = SIGN_MODALITIES.get(sun_sign, "Unknown")

    prompt = f"""Analyse {name}'s astrological profile:
Sun Sign: {sun_sign} ({element} {modality})
DOB: {dob}{f" | Time: {birth_time}" if birth_time else ""}{f" | Place: {birthplace}" if birthplace else ""}

Focus on emotional intelligence, communication style, and relationship patterns.
Return the birth chart JSON."""

    content, provider = await ai_router.complete(
        messages=[
            {"role": "system", "content": CHART_SYSTEM},
            {"role": "user",   "content": prompt},
        ],
        model_type="analysis",
        temperature=0.6,
        max_tokens=1200,
    )
    logger.info(f"Astrology chart via {provider}")

    result = _parse_json(content)
    result.setdefault("sun_sign", sun_sign)
    result.setdefault("element", element)
    result.setdefault("modality", modality)
    return result


async def analyze_compatibility(
    person_a_dob: str,
    person_a_name: str,
    person_b_dob: str,
    person_b_name: str,
) -> dict:
    sign_a = get_sun_sign(person_a_dob)
    sign_b = get_sun_sign(person_b_dob)

    prompt = f"""Analyse compatibility:
{person_a_name}: {sign_a} (born {person_a_dob})
{person_b_name}: {sign_b} (born {person_b_dob})

Return the compatibility JSON."""

    content, provider = await ai_router.complete(
        messages=[
            {"role": "system", "content": COMPAT_SYSTEM},
            {"role": "user",   "content": prompt},
        ],
        model_type="analysis",
        temperature=0.6,
        max_tokens=1200,
    )
    logger.info(f"Astrology compatibility via {provider}")

    result = _parse_json(content)
    result.setdefault("person_a_sign", sign_a)
    result.setdefault("person_b_sign", sign_b)
    return result
