"""
AI Service — with raw text mode support
-----------------------------------------
When raw_text_only=True (screenshot OCR fallback),
uses a different prompt that asks the AI to first extract
structure from the OCR text, then analyse it.
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


ANALYSIS_SYSTEM_PROMPT = """
You are Auraxa's analysis engine. You produce relationship insights
in a specific voice: data-precise but culturally fluent.

VOICE RULES (critical — never break these):
- Use Gen Z language ONLY when the score/data supports it
- Score 85+: confident, celebratory ("slay coded", "main character era")
- Score 65-84: honest warmth ("healing arc", "W rizz incoming")  
- Score 45-64: direct but not harsh ("situationship energy", "mid but fixable")
- Score <45: empowering not devastating ("run. block. heal. that's it fr")
- NEVER say "based on analysis", "it appears that", "upon review"
- Always end verdict with what they CAN do, not just what IS

Return ONLY valid JSON. No markdown. No explanation outside JSON:
{
  "overall_score": 74,
  "compatibility_score": 68,
  "toxicity_level": "low",
  "ghosting_risk": "medium",
  "attachment_style": "anxious",
  "communication_balance": 62,
  "patterns_detected": ["pattern1", "pattern2", "pattern3"],
  "ai_narrative": "2-3 sentence analysis in your voice",
  "genz_verdict": "one punchy Gen Z verdict line — this is the card text"
}
"""
RAW_TEXT_SYSTEM_PROMPT = """You are Auraxa — an expert AI emotional intelligence analyst.

You are given raw OCR text extracted from a chat screenshot. The text may be messy with UI elements, timestamps, and messages mixed together. Your job is to:
1. Identify who the two speakers are from the text
2. Extract the actual conversation messages
3. Perform deep emotional intelligence analysis

Return ONLY a valid JSON object:
{
  "overall_score": <integer 0-100>,
  "compatibility_score": <integer 0-100>,
  "communication_balance": <integer 0-100, 50=equal>,
  "toxicity_level": <"low"|"medium"|"high"|"critical">,
  "attachment_style": <"secure"|"anxious"|"avoidant"|"disorganized">,
  "ghosting_risk": <"low"|"medium"|"high">,
  "patterns_detected": [<3-6 short behavioural pattern strings>],
  "ai_narrative": <2-4 sentences, evidence-based, specific to this conversation>,
  "relationship_type": <"Romantic"|"Friendship"|"Professional"|"Situationship"|"Unknown">,
  "speakers_identified": {"a": "<name or Person A>", "b": "<name or Person B>"},
  "timeline": [
    {"timestamp": <string label>, "emotional_intensity": <float 0-100>, "sentiment": <"positive"|"neutral"|"negative">, "speaker": <"a"|"b">}
  ]
}

Even if the text is messy, do your best to extract emotional patterns. Return ONLY the JSON."""


def _build_analysis_prompt(conversation_data: dict, intent: str) -> str:
    speakers = conversation_data.get("speakers", {})
    a = speakers.get("a", "Person A")
    b = speakers.get("b", "Person B")
    a_pct = conversation_data.get("speaker_a_pct", 50)
    b_pct = conversation_data.get("speaker_b_pct", 50)
    msg_count = conversation_data.get("message_count", 0)
    raw = conversation_data.get("raw_text", "")

    focus_map = {
        "conversation": "Focus on specific emotional dynamics and what's being avoided.",
        "pattern": "Focus on recurring behavioural patterns and relationship arc.",
        "style": "Focus on each person's communication style and emotional expression.",
    }

    return f"""Analyse this conversation between {a} and {b}.

Stats: {msg_count} messages · {a}: {a_pct}% · {b}: {b_pct}%
Focus: {focus_map.get(intent, focus_map['conversation'])}

Conversation:
---
{raw[:7000]}
---

Return the JSON analysis object only."""


def _build_raw_text_prompt(raw_text: str, intent: str) -> str:
    focus_map = {
        "conversation": "Focus on specific emotional dynamics.",
        "pattern": "Focus on recurring behavioural patterns.",
        "style": "Focus on each person's communication style.",
    }
    return f"""This is raw OCR text extracted from a chat screenshot. Extract the conversation and analyse it.

Focus: {focus_map.get(intent, focus_map['conversation'])}

Raw OCR text:
---
{raw_text[:7000]}
---

Identify the speakers, extract messages, and return the JSON analysis."""


async def run_emotional_analysis(conversation_data: dict, intent: str) -> dict:
    """Run emotional analysis with automatic provider failover.
    Handles both structured messages and raw OCR text (screenshot fallback).
    """
    raw_text_only = conversation_data.get("raw_text_only", False)

    if raw_text_only:
        # Screenshot mode — AI extracts structure from raw OCR text
        logger.info("Using raw text mode for screenshot OCR analysis")
        system = RAW_TEXT_SYSTEM_PROMPT
        prompt = _build_raw_text_prompt(
            conversation_data.get("raw_text", ""), intent
        )
    else:
        # Normal mode — structured messages
        system = ANALYSIS_SYSTEM_PROMPT
        prompt = _build_analysis_prompt(conversation_data, intent)

    messages = [
        {"role": "system", "content": system},
        {"role": "user",   "content": prompt},
    ]

    content, provider = await ai_router.complete(
        messages=messages,
        model_type="analysis",
        temperature=0.25,
        max_tokens=2500,
    )
    logger.info(f"Emotional analysis completed via {provider}")

    try:
        result = json.loads(_extract_json(content))

        # If AI identified speakers in raw text mode, update conversation_data
        if raw_text_only and "speakers_identified" in result:
            identified = result.pop("speakers_identified")
            conversation_data["speakers"] = {
                "a": identified.get("a", "Person A"),
                "b": identified.get("b", "Person B"),
            }

        return result
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"JSON parse failed (provider={provider}): {e}\n{content[:300]}")
        raise ValueError(f"AI returned unparseable response via {provider}: {e}")


ADVISOR_SYSTEM_TEMPLATE = """You are Auraxa's AI Emotional Advisor — empathetic, direct, evidence-based.

Context — {a} and {b}:
- Emotional Health: {overall}/100
- Compatibility: {compat}%
- Toxicity: {tox}
- Ghosting Risk: {ghost}
- Attachment: {attach}
- Patterns: {patterns}
- Summary: {narrative}

Rules: Answer based on actual patterns. Be honest but compassionate.
Keep responses 2-3 paragraphs. Never invent information. No therapy advice."""


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

    content, provider = await ai_router.complete(
        messages=messages,
        model_type="advisor",
        temperature=0.7,
        max_tokens=600,
    )
    logger.info(f"Advisor response via {provider}")
    return content
