"""
AI Service — Complete with Expanded Scoring Dimensions
-------------------------------------------------------
Captures: emotional health, compatibility, ghosting risk,
toxicity, initiation balance, response time trend,
sentiment arc, affection signals, peak moments, topics.
"""

import json
import logging
from app.services.ai_router import ai_router

logger = logging.getLogger(__name__)


def _extract_json(text: str) -> str:
    text = text.strip()
    if "```" in text:
        parts = text.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("{"):
                text = part
                break
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in AI response")
    depth = 0
    for i, ch in enumerate(text[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start: i + 1]
    return text[start:]


ANALYSIS_SYSTEM_PROMPT = """You are Auraxa's deep relationship analysis engine. Brutally honest, specific, compassionate — never sugarcoat.

RULES:
- Be SPECIFIC. Use actual patterns from the conversation.
- Be HONEST. Name manipulation, withdrawal, avoidance directly.
- NEVER say "it appears", "it seems", "based on analysis"
- Gen Z voice only when score supports it.
- Score 85+: "slay coded, main character energy fr"
- Score 65-84: "healing arc unlocked, W rizz incoming"
- Score 45-64: "situationship energy, mid but fixable"
- Score <45: "run. block. heal. that's the full plan bestie"

Return ONLY valid JSON — all fields required:

{
  "overall_score": <integer 0-100, emotional health of this connection>,
  "compatibility_score": <integer 0-100>,
  "toxicity_level": <"low"|"medium"|"high"|"critical">,
  "ghosting_risk": <"low"|"medium"|"high">,
  "attachment_style": <"secure"|"anxious"|"avoidant"|"disorganized">,
  "communication_balance": <integer 0-100, 50=perfectly equal>,
  "patterns_detected": [<4-6 specific behavioural pattern strings>],
  "ai_narrative": "<4-5 brutally honest sentences — specific to this conversation>",
  "genz_verdict": "<one punchy Gen Z verdict>",

  "scoring_breakdown": {
    "emotional_health": <integer 0-100>,
    "emotional_health_note": "<one sentence explaining this score>",
    "compatibility": <integer 0-100>,
    "compatibility_note": "<one sentence>",
    "toxicity_score": <integer 0-100, 0=none, 100=critical>,
    "toxicity_note": "<one sentence>",
    "ghosting_score": <integer 0-100, 0=none, 100=certain ghost>,
    "ghosting_note": "<one sentence>"
  },

  "sub_metrics": {
    "initiation_balance": {
      "person_a_pct": <integer 0-100>,
      "person_b_pct": <integer 0-100>,
      "who_initiates_more": "<name of person who initiates more, or 'equal'>",
      "note": "<one sentence on what this imbalance means>"
    },
    "response_time_trend": {
      "trend": <"improving"|"declining"|"stable"|"erratic">,
      "person_a_trend": "<faster/slower/consistent>",
      "person_b_trend": "<faster/slower/consistent>",
      "note": "<one sentence on what this pattern reveals>"
    },
    "sentiment_arc": {
      "early_sentiment": <"positive"|"neutral"|"negative">,
      "middle_sentiment": <"positive"|"neutral"|"negative">,
      "recent_sentiment": <"positive"|"neutral"|"negative">,
      "arc_direction": <"improving"|"declining"|"stable"|"volatile">,
      "note": "<one sentence on how the emotional tone has shifted>"
    },
    "affection_signals": {
      "count": <integer — number of affectionate messages/moments>,
      "quality": <"high"|"medium"|"low"|"absent">,
      "who_shows_more": "<name or 'equal'>",
      "examples": ["<2-3 specific types of affection shown, e.g. 'compliments', 'checking in', 'pet names'>"],
      "note": "<one sentence on the affection dynamic>"
    }
  },

  "hard_truths": [
    "<3-5 specific uncomfortable truths about this relationship>"
  ],

  "key_topics": [
    {
      "topic": "<topic name, max 3 words>",
      "frequency": <"high"|"medium"|"low">,
      "sentiment": <"positive"|"neutral"|"negative"|"mixed">,
      "description": "<one honest sentence>"
    }
  ],

  "conversation_phases": [
    {
      "phase_number": <1, 2, 3...>,
      "phase_name": "<evocative name e.g. 'The Honeymoon', 'The Slow Fade'>",
      "description": "<2-3 sentences on what this phase felt like and what was really happening>",
      "dominant_emotion": "<primary emotion in this phase>",
      "shift_trigger": "<what caused transition to next phase>",
      "red_or_green": <"red"|"green"|"neutral">
    }
  ],

  "peak_moments": {
    "highest_point": {
      "description": "<specific description of the best moment in this conversation>",
      "why_it_mattered": "<one sentence on why this moment was significant>"
    },
    "lowest_point": {
      "description": "<specific description of the worst/most tense moment>",
      "what_it_revealed": "<one sentence on what it exposed>"
    },
    "turning_point": "<the specific moment everything shifted — if none, say 'No clear turning point detected'>",
    "most_authentic_moment": "<when both people were most genuinely themselves>"
  },

  "conversation_themes": {
    "primary_theme": "<the dominant theme>",
    "emotional_undercurrent": "<what runs beneath the surface>",
    "what_they_avoid": "<specific topic/feeling consistently avoided>",
    "what_they_return_to": "<what they keep coming back to>",
    "overall_tone": "<honest vibe: warm/cold/anxious/playful/tense/performative/guarded>"
  },

  "communication_analysis": {
    "who_initiates_more": "<person name or 'equal'>",
    "initiation_percentage": "<e.g. '65% A, 35% B'>",
    "response_style_a": "<honest assessment>",
    "response_style_b": "<honest assessment>",
    "humor_level": "<none|occasional|frequent|constant>",
    "affection_shown": "<how they show care or the honest truth if they don't>",
    "conflict_style": "<how they handle tension>",
    "power_dynamic": "<equal|A dominant|B dominant|shifting>"
  },

  "red_flags": [
    {
      "flag": "<specific red flag>",
      "severity": <"minor"|"moderate"|"serious">,
      "evidence": "<specific pattern observed>"
    }
  ],

  "green_flags": [
    {
      "flag": "<specific positive pattern>",
      "evidence": "<specific example>"
    }
  ],

  "emotional_moments": {
    "most_positive_moment": "<the genuine high point>",
    "most_tense_moment": "<the real low>",
    "turning_point": "<moment everything changed>",
    "unresolved_tension": "<what's still sitting there unaddressed>"
  },

  "relationship_health_indicators": {
    "mutual_respect": <integer 0-100>,
    "emotional_safety": <integer 0-100>,
    "authenticity": <integer 0-100>,
    "reciprocity": <integer 0-100>,
    "growth_potential": <integer 0-100>
  },

  "roast": {
    "person_a_roast": "<specific, honest, 2-3 sentence roast of Person A's patterns>",
    "person_b_roast": "<same for Person B>",
    "relationship_roast": "<roast the dynamic as a whole>",
    "roast_verdict": "<one final savage but loving line>"
  },

  "astrology_reading": {
    "inferred_sign_a": "<inferred zodiac from their communication style>",
    "inferred_sign_b": "<inferred zodiac from their communication style>",
    "cosmic_compatibility": "<what astrology says about this pairing>",
    "element_dynamic": "<element combination and what it means>",
    "mercury_reading": "<communication style through astrology lens>",
    "venus_reading": "<love style through astrology lens>",
    "saturn_truth": "<the karmic lesson this connection teaches>",
    "cosmic_verdict": "<one sentence from the cosmos>"
  },

  "what_this_reveals": "<3 sentences on what this reveals that they haven't admitted to themselves>",
  "therapist_note": "<2-3 sentences of honest clinical insight>"
}"""


RAW_TEXT_SYSTEM_PROMPT = """You are Auraxa — brutally honest AI emotional intelligence analyst.

Given raw OCR text from a chat screenshot, extract the conversation and perform a deeply honest analysis.

Return ONLY a valid JSON object with ALL fields from the full analysis schema including:
overall_score, compatibility_score, toxicity_level, ghosting_risk, attachment_style,
communication_balance, patterns_detected, ai_narrative, genz_verdict, scoring_breakdown,
sub_metrics, hard_truths, key_topics, conversation_phases, peak_moments,
conversation_themes, communication_analysis, red_flags, green_flags,
emotional_moments, relationship_health_indicators, roast, astrology_reading,
what_this_reveals, therapist_note.

Also include:
"speakers_identified": {"a": "<name or Person A>", "b": "<name or Person B>"}
"timeline": [{"timestamp": "<label>", "emotional_intensity": <0-100>, "sentiment": <"positive"|"neutral"|"negative">, "speaker": <"a"|"b">}]"""


def _build_analysis_prompt(conversation_data: dict, intent: str) -> str:
    speakers  = conversation_data.get("speakers", {})
    a         = speakers.get("a", "Person A")
    b         = speakers.get("b", "Person B")
    a_pct     = conversation_data.get("speaker_a_pct", 50)
    b_pct     = conversation_data.get("speaker_b_pct", 50)
    msg_count = conversation_data.get("message_count", 0)
    raw       = conversation_data.get("raw_text", "")

    focus_map = {
        "conversation": "Focus on the emotional truth beneath — what's really being said between the lines.",
        "pattern":      "Focus on recurring patterns and how the relationship has evolved.",
        "style":        "Focus on communication styles and what they reveal psychologically.",
    }

    return f"""Perform a comprehensive, brutally honest emotional intelligence analysis of this conversation between {a} and {b}.

Stats: {msg_count} messages · {a}: {a_pct}% · {b}: {b_pct}%
Focus: {focus_map.get(intent, focus_map['conversation'])}

CRITICAL — Fill ALL fields:
- sub_metrics: calculate initiation balance, response time trend, sentiment arc (early/middle/recent), affection signal count
- conversation_phases: identify ALL major phases with what triggered each transition
- peak_moments: the highest point, lowest point, turning point, most authentic moment
- scoring_breakdown: separate scores for emotional health, compatibility, toxicity, ghosting
- roast: be specific to THIS conversation, not generic
- astrology: infer from actual communication patterns

Conversation:
---
{raw[:9000]}
---

Return ONLY the complete JSON with every field filled."""


def _build_raw_text_prompt(raw_text: str, intent: str) -> str:
    focus_map = {
        "conversation": "Focus on the emotional truth.",
        "pattern":      "Focus on behavioural patterns.",
        "style":        "Focus on communication styles.",
    }
    return f"""Raw OCR text from a chat screenshot. Extract and analyse completely.

Focus: {focus_map.get(intent, focus_map['conversation'])}

Raw OCR text:
---
{raw_text[:9000]}
---

Return the COMPLETE JSON with ALL fields including sub_metrics, phases, peak_moments, scoring_breakdown, roast, astrology."""


async def run_emotional_analysis(conversation_data: dict, intent: str) -> tuple[dict, dict]:
    """Run complete emotional analysis. Returns (result_dict, usage_dict)."""
    raw_text_only = conversation_data.get("raw_text_only", False)

    if raw_text_only:
        logger.info("Using raw text mode for screenshot OCR")
        system = RAW_TEXT_SYSTEM_PROMPT
        prompt = _build_raw_text_prompt(conversation_data.get("raw_text", ""), intent)
    else:
        system = ANALYSIS_SYSTEM_PROMPT
        prompt = _build_analysis_prompt(conversation_data, intent)

    messages = [
        {"role": "system", "content": system},
        {"role": "user",   "content": prompt},
    ]

    content, provider, usage = await ai_router.complete(
        messages=messages,
        model_type="analysis",
        temperature=0.25,
        max_tokens=4000,
    )
    logger.info(f"Analysis completed via {provider} | tokens={usage.get('total_tokens', 0)}")

    try:
        result = json.loads(_extract_json(content))

        if raw_text_only and "speakers_identified" in result:
            identified = result.pop("speakers_identified")
            conversation_data["speakers"] = {
                "a": identified.get("a", "Person A"),
                "b": identified.get("b", "Person B"),
            }

        return result, usage

    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"JSON parse failed (provider={provider}): {e}\n{content[:300]}")
        raise ValueError(f"AI returned unparseable response via {provider}: {e}")


ADVISOR_SYSTEM_TEMPLATE = """You are Auraxa's AI Emotional Advisor — honest, direct, evidence-based.

Context — {a} and {b}:
- Emotional Health: {overall}/100
- Compatibility: {compat}%
- Toxicity: {tox}
- Ghosting Risk: {ghost}
- Attachment: {attach}
- Patterns: {patterns}
- Summary: {narrative}

Be honest. Be specific. Be compassionate but don't soften hard truths. 2-3 paragraphs max."""


async def get_advisor_response(
    message: str,
    conversation_history: list[dict],
    analysis_summary: dict,
) -> str:
    scores   = analysis_summary.get("scores", {})
    speakers = analysis_summary.get("speakers", {})

    system = ADVISOR_SYSTEM_TEMPLATE.format(
        a=speakers.get("a", "Person A"),
        b=speakers.get("b", "Person B"),
        overall=scores.get("overall_score", "N/A"),
        compat=scores.get("compatibility_score", "N/A"),
        tox=scores.get("toxicity_level", "N/A"),
        ghost=scores.get("ghosting_risk", "N/A"),
        attach=scores.get("attachment_style", "N/A"),
        patterns=", ".join(scores.get("patterns_detected", [])),
        narrative=scores.get("ai_narrative", "N/A"),
    )

    messages = [{"role": "system", "content": system}]
    messages.extend(conversation_history[-10:])
    messages.append({"role": "user", "content": message})

    content, provider, _usage = await ai_router.complete(
        messages=messages,
        model_type="advisor",
        temperature=0.7,
        max_tokens=600,
    )
    logger.info(f"Advisor response via {provider}")
    return content
