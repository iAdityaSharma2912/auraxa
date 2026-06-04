"""
Astrology Service — Comprehensive Report Generation
----------------------------------------------------
Generates detailed birth charts, compatibility readings,
and cosmic relationship insights via AI.
"""
import json
import logging
from app.services.ai_router import ai_router

logger = logging.getLogger(__name__)


def _extract_json(text: str) -> str:
    text = text.strip()
    if "```" in text:
        for part in text.split("```"):
            part = part.strip().lstrip("json").strip()
            if part.startswith("{"):
                text = part
                break
    start = text.find("{")
    end   = text.rfind("}") + 1
    if start != -1 and end > start:
        return text[start:end]
    raise ValueError("No JSON found in response")


BIRTH_CHART_PROMPT = """You are Auraxa's master astrologer. Generate a deeply detailed, accurate birth chart reading.

Return ONLY a valid JSON object:
{
  "sun_sign": "<zodiac sign>",
  "symbol": "<zodiac symbol emoji>",
  "element": "<Fire|Water|Earth|Air>",
  "modality": "<Cardinal|Fixed|Mutable>",
  "ruling_planet": "<planet name>",
  "ruling_planet_symbol": "<planet symbol emoji>",
  "tagline": "<one powerful sentence that captures this sign's essence>",

  "personality": {
    "overview": "<3-4 sentences deep personality overview, specific and insightful>",
    "core_traits": ["<6-8 specific personality traits>"],
    "strengths": ["<5 genuine strengths with brief explanations>"],
    "challenges": ["<4 real challenges/shadow traits with brief explanations>"],
    "shadow_side": "<2 sentences on their unconscious patterns and shadow>",
    "hidden_depth": "<2 sentences on what most people don't see about this sign>"
  },

  "love_and_relationships": {
    "overview": "<3 sentences on how they love and what they need>",
    "love_language": "<their primary love language and why>",
    "ideal_partner": "<what they truly need in a partner>",
    "dealbreakers": ["<3 dealbreakers for this sign>"],
    "best_matches": ["<3 most compatible signs with brief reason>"],
    "challenging_matches": ["<2 challenging signs with brief reason>"],
    "attachment_tendency": "<their natural attachment style and pattern>",
    "red_flags_they_show": "<what toxic patterns they may display>",
    "what_they_need_to_hear": "<one truth this sign needs to accept about love>"
  },

  "career_and_purpose": {
    "overview": "<2-3 sentences on their professional nature>",
    "ideal_careers": ["<5-6 specific career paths>"],
    "work_style": "<how they work best>",
    "leadership_style": "<their natural leadership approach>",
    "financial_tendency": "<their relationship with money>",
    "life_purpose": "<their deeper soul purpose in 2 sentences>"
  },

  "spiritual_and_cosmic": {
    "element_deep_dive": "<2 sentences on what their element means for them specifically>",
    "modality_meaning": "<1 sentence on what cardinal/fixed/mutable means for them>",
    "north_node_theme": "<the evolutionary lesson for this sign>",
    "karmic_pattern": "<the karmic pattern this sign is here to transcend>",
    "manifestation_style": "<how this sign manifests best>",
    "power_days": "<which days/phases of the moon are most powerful>",
    "crystals": ["<3 crystals for this sign>"],
    "mantra": "<a powerful mantra for this sign>"
  },

  "current_forecast": {
    "year_2026": "<2-3 sentences on what 2026 holds for this sign>",
    "key_themes": ["<3 major themes for this year>"],
    "watch_out_for": "<1 warning for this year>",
    "opportunity": "<the biggest opportunity this year>"
  },

  "famous_examples": ["<3 famous people with this sun sign>"]
}"""


COMPATIBILITY_PROMPT = """You are Auraxa's relationship astrologer. Generate a comprehensive compatibility reading.

Return ONLY a valid JSON object:
{
  "compatibility_score": <integer 0-100>,
  "compatibility_label": "<Cosmic Soulmates|Deep Connection|Strong Potential|Magnetic Tension|Growth Challenge|Complex Dynamic>",
  "tagline": "<one punchy sentence about this pairing>",

  "overview": "<3-4 sentences on the overall dynamic between these signs>",

  "synastry": {
    "emotional_compatibility": { "score": <0-100>, "description": "<2 sentences>" },
    "intellectual_compatibility": { "score": <0-100>, "description": "<2 sentences>" },
    "physical_compatibility": { "score": <0-100>, "description": "<2 sentences>" },
    "communication_style": { "score": <0-100>, "description": "<2 sentences>" },
    "long_term_potential": { "score": <0-100>, "description": "<2 sentences>" }
  },

  "strengths": ["<4 genuine strengths of this pairing>"],
  "challenges": ["<3 honest challenges this pair will face>"],

  "dynamic": {
    "who_leads": "<who naturally takes the lead and why>",
    "who_nurtures": "<who provides emotional support>",
    "tension_point": "<the main source of conflict>",
    "growth_opportunity": "<what they teach each other>"
  },

  "love_advice": {
    "for_person_a": "<specific advice for the first sign>",
    "for_person_b": "<specific advice for the second sign>",
    "together": "<what they both need to do to thrive>"
  },

  "famous_couples": ["<2-3 famous couples with this sign combination>"],
  "verdict": "<one honest Gen Z-coded verdict about this pairing>"
}"""


async def analyze_birth_chart(
    dob: str,
    name: str = "You",
    birth_time: str = None,
    birthplace: str = None,
) -> dict:
    """Generate comprehensive birth chart reading."""
    time_info  = f"Birth time: {birth_time}" if birth_time else "Birth time: unknown"
    place_info = f"Birthplace: {birthplace}" if birthplace else "Birthplace: unknown"

    prompt = f"""Generate a comprehensive birth chart reading for:
Name: {name}
Date of Birth: {dob}
{time_info}
{place_info}

Be deeply specific, insightful, and accurate to this sign's actual astrological meaning.
Return ONLY the JSON."""

    try:
        content, provider, _usage = await ai_router.complete(
            messages=[
                {"role": "system", "content": BIRTH_CHART_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            model_type="analysis",
            temperature=0.6,
            max_tokens=3000,
        )
        logger.info(f"Birth chart via {provider}")
        result = json.loads(_extract_json(content))
        result["name"] = name
        result["dob"]  = dob
        return result
    except Exception as e:
        logger.error(f"Birth chart failed: {e}")
        raise ValueError(f"Chart generation failed: {e}")


async def analyze_compatibility(
    person_a_dob: str,
    person_a_name: str = "You",
    person_b_dob: str  = "",
    person_b_name: str = "Them",
) -> dict:
    """Generate comprehensive compatibility reading."""
    prompt = f"""Generate a comprehensive astrological compatibility reading for:

Person A: {person_a_name} (DOB: {person_a_dob})
Person B: {person_b_name} (DOB: {person_b_dob})

Be honest about both the strengths and genuine challenges.
If this is a difficult pairing, say so clearly but constructively.
Return ONLY the JSON."""

    try:
        content, provider, _usage = await ai_router.complete(
            messages=[
                {"role": "system", "content": COMPATIBILITY_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            model_type="analysis",
            temperature=0.65,
            max_tokens=2500,
        )
        logger.info(f"Compatibility via {provider}")
        result = json.loads(_extract_json(content))
        result["person_a"] = {"name": person_a_name, "dob": person_a_dob}
        result["person_b"] = {"name": person_b_name, "dob": person_b_dob}
        return result
    except Exception as e:
        logger.error(f"Compatibility failed: {e}")
        raise ValueError(f"Compatibility reading failed: {e}")
