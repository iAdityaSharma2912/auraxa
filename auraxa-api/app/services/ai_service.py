"""
AI Service — 2-Call, Anti-Anchoring Scoring
---------------------------------------------
Call 1: scores + roast + astrology + health + flags  (always completes)
Call 2: topics + phases + peaks + themes + reveals   (detail)

Anti-anchoring: forces AI away from lazy 70-80 default.
Temperature 0.6 for genuine score variance.
"""

import json
import logging
from app.services.ai_router import ai_router

logger = logging.getLogger(__name__)

INSTAGRAM_HANDLE = "@iaddy29"


def _extract_json(text: str) -> str:
    text = text.strip()
    if "```" in text:
        for part in text.split("```"):
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("{"):
                text = part
                break
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON found")
    depth = 0
    for i, ch in enumerate(text[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start: i + 1]
    return text[start:]


# ─── CALL 1: Core + Priority sections ─────────────────────

CALL1_PROMPT = """You are Auraxa, a brutally honest relationship analyst. Specific, not generic.

SCORING RULES — MANDATORY:
- Use the FULL 0-100 range. Do NOT default to 70-80. That is lazy.
- 90-100: exceptional, rare genuine connection (almost never)
- 75-89: good with real issues present
- 55-74: significant problems, real work needed
- 35-54: serious red flags, unhealthy patterns
- 0-34: toxic, harmful, get out now
- Score MUST reflect THIS specific conversation. Not a generic score.
- If you give 75, cite 3 specific reasons from the text why it's exactly 75 and not 60 or 85.
- One-sided effort, avoidance, emotional withdrawal → 50-65
- Manipulation, consistent toxicity, ghosting patterns → below 50
- Mutual vulnerability, consistent support, healthy conflict resolution → 80+

Gen Z verdicts: 85+="slay coded fr", 65-84="healing arc unlocked", 45-64="situationship energy mid", <45="run block heal bestie"

Return ONLY compact JSON:
{
  "overall_score": <integer 0-100 — based on actual patterns found>,
  "compatibility_score": <integer 0-100>,
  "toxicity_level": <"low"|"medium"|"high"|"critical">,
  "ghosting_risk": <"low"|"medium"|"high">,
  "attachment_style": <"secure"|"anxious"|"avoidant"|"disorganized">,
  "communication_balance": <integer 0-100, 50=equal>,
  "patterns_detected": ["<4-6 SPECIFIC behavioural patterns from THIS conversation>"],
  "ai_narrative": "<4 brutally honest sentences — cite specific examples from the chat>",
  "genz_verdict": "<one punchy verdict matching the score range>",
  "scoring_breakdown": {
    "emotional_health": <0-100>,
    "emotional_health_note": "<one sentence with specific evidence>",
    "compatibility": <0-100>,
    "compatibility_note": "<one sentence with specific evidence>",
    "toxicity_score": <0-100>,
    "toxicity_note": "<one sentence with specific evidence>",
    "ghosting_score": <0-100>,
    "ghosting_note": "<one sentence with specific evidence>"
  },
  "sub_metrics": {
    "initiation_balance": {
      "person_a_pct": <0-100>,
      "person_b_pct": <0-100>,
      "who_initiates_more": "<name or equal>",
      "note": "<one sentence>"
    },
    "response_time_trend": {
      "trend": <"improving"|"declining"|"stable"|"erratic">,
      "person_a_trend": "<faster|slower|consistent>",
      "person_b_trend": "<faster|slower|consistent>",
      "note": "<one sentence>"
    },
    "sentiment_arc": {
      "early_sentiment": <"positive"|"neutral"|"negative">,
      "middle_sentiment": <"positive"|"neutral"|"negative">,
      "recent_sentiment": <"positive"|"neutral"|"negative">,
      "arc_direction": <"improving"|"declining"|"stable"|"volatile">,
      "note": "<one sentence>"
    },
    "affection_signals": {
      "count": <integer>,
      "quality": <"high"|"medium"|"low"|"absent">,
      "who_shows_more": "<name or equal>",
      "examples": ["<type1>","<type2>"],
      "note": "<one sentence>"
    }
  },
  "hard_truths": ["<3-4 SPECIFIC uncomfortable truths — cite actual patterns>"],
  "roast": {
    "person_a_roast": "<2-3 sentence specific roast — use their actual behaviour>",
    "person_b_roast": "<2-3 sentence specific roast — use their actual behaviour>",
    "relationship_roast": "<2 sentence roast of the dynamic>",
    "roast_verdict": "<one final savage but loving line>"
  },
  "astrology_reading": {
    "inferred_sign_a": "<zodiac inferred from communication style>",
    "inferred_sign_b": "<zodiac inferred from communication style>",
    "cosmic_compatibility": "<one sentence>",
    "element_dynamic": "<one sentence>",
    "mercury_reading": "<one sentence>",
    "venus_reading": "<one sentence>",
    "saturn_truth": "<one sentence>",
    "cosmic_verdict": "<one sentence from the cosmos>"
  },
  "relationship_health_indicators": {
    "mutual_respect": <0-100>,
    "emotional_safety": <0-100>,
    "authenticity": <0-100>,
    "reciprocity": <0-100>,
    "growth_potential": <0-100>
  },
  "communication_analysis": {
    "who_initiates_more": "<name or equal>",
    "initiation_percentage": "<e.g. 60% A, 40% B>",
    "response_style_a": "<one honest sentence>",
    "response_style_b": "<one honest sentence>",
    "humor_level": "<none|occasional|frequent|constant>",
    "affection_shown": "<one sentence>",
    "conflict_style": "<one sentence>",
    "power_dynamic": "<equal|A dominant|B dominant|shifting>"
  },
  "red_flags": [
    {"flag": "<specific red flag>", "severity": "<minor|moderate|serious>", "evidence": "<specific pattern>"}
  ],
  "green_flags": [
    {"flag": "<specific positive>", "evidence": "<specific example>"}
  ],
  "emotional_moments": {
    "most_positive_moment": "<specific moment>",
    "most_tense_moment": "<specific moment>",
    "turning_point": "<specific moment>",
    "unresolved_tension": "<what is unaddressed>"
  }
}"""


# ─── CALL 2: Detail sections ───────────────────────────────

CALL2_PROMPT = """You are Auraxa. Given this conversation, return ONLY the detail analysis JSON:
{
  "key_topics": [
    {"topic": "<3 words max>", "frequency": "<high|medium|low>", "sentiment": "<positive|neutral|negative|mixed>", "description": "<one honest sentence>"}
  ],
  "conversation_phases": [
    {
      "phase_number": <1,2,3...>,
      "phase_name": "<evocative name like 'The Slow Fade' or 'The Honeymoon'>",
      "description": "<2 sentences on what was really happening>",
      "dominant_emotion": "<primary emotion>",
      "shift_trigger": "<what caused transition to next phase>",
      "red_or_green": <"red"|"green"|"neutral">
    }
  ],
  "peak_moments": {
    "highest_point": {
      "description": "<specific best moment>",
      "why_it_mattered": "<one sentence>"
    },
    "lowest_point": {
      "description": "<specific worst moment>",
      "what_it_revealed": "<one sentence>"
    },
    "turning_point": "<specific moment or 'No clear turning point detected'>",
    "most_authentic_moment": "<when both were most genuinely themselves>"
  },
  "conversation_themes": {
    "primary_theme": "<dominant theme>",
    "emotional_undercurrent": "<what runs beneath>",
    "what_they_avoid": "<topic/feeling avoided>",
    "what_they_return_to": "<what they keep coming back to>",
    "overall_tone": "<warm|cold|anxious|playful|tense|performative|guarded>"
  },
  "what_this_reveals": "<3 sentences on what this reveals they haven't admitted to themselves>",
  "therapist_note": "<2-3 sentences of clinical insight. If you need to talk to a real person, reach out on Instagram: @iaddy29>"
}"""


# ─── RAW TEXT MODE (screenshot / .txt) ────────────────────

RAW_CALL1_SYSTEM = """You are Auraxa. Given raw WhatsApp/chat text, extract the conversation and return a compact honest analysis.

SCORING RULES — MANDATORY:
- Use the full 0-100 range. Do NOT give 75 by default.
- One-sided effort / avoidance / withdrawal → score 50-65
- Toxicity / manipulation / ghosting → score below 50
- Genuine mutual connection → score 80+
- Must justify score with specific evidence from the chat.

Return ONLY this JSON:
{
  "speakers_identified": {"a": "<name>", "b": "<name>"},
  "overall_score": <0-100>,
  "compatibility_score": <0-100>,
  "toxicity_level": "<low|medium|high|critical>",
  "ghosting_risk": "<low|medium|high>",
  "attachment_style": "<secure|anxious|avoidant|disorganized>",
  "communication_balance": <0-100>,
  "patterns_detected": ["<p1>","<p2>","<p3>","<p4>"],
  "ai_narrative": "<4 specific honest sentences citing actual patterns>",
  "genz_verdict": "<punchy verdict matching score range>",
  "scoring_breakdown": {
    "emotional_health": <0-100>, "emotional_health_note": "<1 sentence with evidence>",
    "compatibility": <0-100>, "compatibility_note": "<1 sentence>",
    "toxicity_score": <0-100>, "toxicity_note": "<1 sentence>",
    "ghosting_score": <0-100>, "ghosting_note": "<1 sentence>"
  },
  "sub_metrics": {
    "initiation_balance": {"person_a_pct": <0-100>, "person_b_pct": <0-100>, "who_initiates_more": "<name>", "note": "<1s>"},
    "response_time_trend": {"trend": "<stable|improving|declining|erratic>", "person_a_trend": "<consistent|faster|slower>", "person_b_trend": "<consistent|faster|slower>", "note": "<1s>"},
    "sentiment_arc": {"early_sentiment": "<pos|neu|neg>", "middle_sentiment": "<pos|neu|neg>", "recent_sentiment": "<pos|neu|neg>", "arc_direction": "<stable|improving|declining|volatile>", "note": "<1s>"},
    "affection_signals": {"count": <int>, "quality": "<high|medium|low|absent>", "who_shows_more": "<name>", "examples": ["<ex>"], "note": "<1s>"}
  },
  "hard_truths": ["<specific t1>","<specific t2>","<specific t3>"],
  "roast": {
    "person_a_roast": "<specific 2s roast>",
    "person_b_roast": "<specific 2s roast>",
    "relationship_roast": "<2s dynamic roast>",
    "roast_verdict": "<1 savage loving line>"
  },
  "astrology_reading": {
    "inferred_sign_a": "<sign>", "inferred_sign_b": "<sign>",
    "cosmic_compatibility": "<1s>", "element_dynamic": "<1s>",
    "mercury_reading": "<1s>", "venus_reading": "<1s>",
    "saturn_truth": "<1s>", "cosmic_verdict": "<1s>"
  },
  "relationship_health_indicators": {
    "mutual_respect": <0-100>, "emotional_safety": <0-100>,
    "authenticity": <0-100>, "reciprocity": <0-100>, "growth_potential": <0-100>
  },
  "communication_analysis": {
    "who_initiates_more": "<name>", "initiation_percentage": "<60% A, 40% B>",
    "response_style_a": "<1s>", "response_style_b": "<1s>",
    "humor_level": "<occasional>", "affection_shown": "<1s>",
    "conflict_style": "<1s>", "power_dynamic": "<equal|A dominant|B dominant|shifting>"
  },
  "red_flags": [{"flag": "<flag>", "severity": "<minor|moderate|serious>", "evidence": "<1s>"}],
  "green_flags": [{"flag": "<flag>", "evidence": "<1s>"}],
  "emotional_moments": {
    "most_positive_moment": "<specific>", "most_tense_moment": "<specific>",
    "turning_point": "<specific>", "unresolved_tension": "<specific>"
  }
}"""

RAW_CALL2_SYSTEM = """You are Auraxa. Given raw chat text, return ONLY the detail JSON:
{
  "key_topics": [{"topic": "<3 words>", "frequency": "<high|medium|low>", "sentiment": "<positive|neutral|negative|mixed>", "description": "<1 honest sentence>"}],
  "conversation_phases": [
    {"phase_number": <1,2,3>, "phase_name": "<evocative name>", "description": "<2 sentences>", "dominant_emotion": "<emotion>", "shift_trigger": "<trigger>", "red_or_green": "<red|green|neutral>"}
  ],
  "peak_moments": {
    "highest_point": {"description": "<specific>", "why_it_mattered": "<1s>"},
    "lowest_point": {"description": "<specific>", "what_it_revealed": "<1s>"},
    "turning_point": "<specific or No clear turning point>",
    "most_authentic_moment": "<specific>"
  },
  "conversation_themes": {
    "primary_theme": "<theme>", "emotional_undercurrent": "<undercurrent>",
    "what_they_avoid": "<avoid>", "what_they_return_to": "<return>",
    "overall_tone": "<tone>"
  },
  "what_this_reveals": "<3 sentences>",
  "therapist_note": "<2-3 sentences of clinical insight. If you need to talk to a real person, reach out on Instagram: @iaddy29>"
}"""


# ─── PROMPT BUILDERS ──────────────────────────────────────

def _build_call1_user(conversation_data: dict, intent: str) -> str:
    speakers  = conversation_data.get("speakers", {})
    a         = speakers.get("a", "Person A")
    b         = speakers.get("b", "Person B")
    a_pct     = conversation_data.get("speaker_a_pct", 50)
    b_pct     = conversation_data.get("speaker_b_pct", 50)
    msg_count = conversation_data.get("message_count", 0)
    raw       = conversation_data.get("raw_text", "")

    focus = {
        "conversation": "emotional truth between the lines",
        "pattern":      "recurring behavioural patterns",
        "style":        "communication styles and psychology",
    }.get(intent, "emotional truth")

    return f"""Analyse this conversation between {a} and {b}.
Stats: {msg_count} messages | {a}: {a_pct}% | {b}: {b_pct}%
Focus: {focus}

CRITICAL SCORING: Do NOT give 75 by default. Look for:
- Who initiates more? (imbalance = lower score)
- Is there avoidance or withdrawal? (lower score)
- Are both people emotionally present? (higher score)
- Any manipulation, guilt trips, or passive aggression? (much lower score)
- Give the REAL score this conversation deserves, not the safe middle.

Conversation:
---
{raw[:7000]}
---

Return compact JSON. Score must reflect actual evidence found above."""


def _build_call2_user(conversation_data: dict, intent: str) -> str:
    speakers = conversation_data.get("speakers", {})
    a        = speakers.get("a", "Person A")
    b        = speakers.get("b", "Person B")
    raw      = conversation_data.get("raw_text", "")

    return f"""Conversation between {a} and {b}:
---
{raw[:7000]}
---

Return ONLY the detail JSON (key_topics, conversation_phases, peak_moments, conversation_themes, what_this_reveals, therapist_note)."""


# ─── MAIN ANALYSIS FUNCTION ───────────────────────────────

async def run_emotional_analysis(conversation_data: dict, intent: str) -> tuple[dict, dict]:
    """
    2-call analysis for guaranteed section completion.
    Call 1: priority (scores, roast, astrology, health, flags)
    Call 2: detail (topics, phases, peaks, themes, reveals)
    """
    raw_text_only = conversation_data.get("raw_text_only", False)

    if raw_text_only:
        sys1 = RAW_CALL1_SYSTEM
        sys2 = RAW_CALL2_SYSTEM
        raw  = conversation_data.get("raw_text", "")
        u1   = f"Raw chat text — extract and analyse:\n---\n{raw[:7000]}\n---\nReturn compact analysis JSON. Give the REAL score, not 75."
        u2   = f"Raw chat text:\n---\n{raw[:7000]}\n---\nReturn ONLY the detail JSON (topics, phases, peaks, themes, reveals, therapist_note)."
    else:
        sys1 = CALL1_PROMPT
        sys2 = CALL2_PROMPT
        u1   = _build_call1_user(conversation_data, intent)
        u2   = _build_call2_user(conversation_data, intent)

    # ── Call 1: Priority (scores, roast, astrology, health) ──
    c1, provider, usage1 = await ai_router.complete(
        messages=[
            {"role": "system", "content": sys1},
            {"role": "user",   "content": u1},
        ],
        model_type="analysis",
        temperature=0.6,
        max_tokens=4000,
    )
    logger.info(f"[Call 1] {provider} | tokens={usage1.get('total_tokens', 0)}")

    result1 = json.loads(_extract_json(c1))

    # Extract speaker names from raw mode
    if raw_text_only and "speakers_identified" in result1:
        identified = result1.pop("speakers_identified")
        conversation_data["speakers"] = {
            "a": identified.get("a", "Person A"),
            "b": identified.get("b", "Person B"),
        }

    # ── Call 2: Detail (topics, phases, peaks) ────────────
    result2 = {}
    try:
        c2, _, usage2 = await ai_router.complete(
            messages=[
                {"role": "system", "content": sys2},
                {"role": "user",   "content": u2},
            ],
            model_type="analysis",
            temperature=0.5,
            max_tokens=3000,
        )
        result2 = json.loads(_extract_json(c2))
        total_tokens = usage1.get("total_tokens", 0) + usage2.get("total_tokens", 0)
        logger.info(f"[Call 2] done | total_tokens={total_tokens}")
    except Exception as e:
        logger.warning(f"[Call 2] failed (non-fatal): {e}")

    # ── Merge both calls ───────────────────────────────────
    result = {**result1, **result2}

    # Always append Instagram to therapist_note
    insta = f"If you need to talk to a real person, reach out on Instagram: {INSTAGRAM_HANDLE}"
    if result.get("therapist_note"):
        note = result["therapist_note"].strip().rstrip(".")
        if INSTAGRAM_HANDLE not in note:
            result["therapist_note"] = f"{note}. {insta}"
    else:
        result["therapist_note"] = insta

    combined_usage = {
        "total_tokens":      usage1.get("total_tokens", 0) + (usage2.get("total_tokens", 0) if result2 else 0),
        "prompt_tokens":     usage1.get("prompt_tokens", 0),
        "completion_tokens": usage1.get("completion_tokens", 0),
    }
    return result, combined_usage


# ─── ADVISOR ──────────────────────────────────────────────

ADVISOR_SYSTEM = """You are Auraxa's AI Emotional Advisor — honest, direct, evidence-based.

Context — {a} and {b}:
- Emotional Health: {overall}/100
- Compatibility: {compat}%
- Toxicity: {tox} | Ghosting Risk: {ghost} | Attachment: {attach}
- Patterns: {patterns}
- Summary: {narrative}

Be honest. Be specific to their situation. 2-3 paragraphs max.
No sugarcoating. No generic advice.
If the person seems distressed or needs more support, mention they can also reach out on Instagram: {insta}"""


async def get_advisor_response(
    message: str,
    conversation_history: list[dict],
    analysis_summary: dict,
) -> str:
    scores   = analysis_summary.get("scores", {})
    speakers = analysis_summary.get("speakers", {})

    system = ADVISOR_SYSTEM.format(
        a=speakers.get("a", "Person A"),
        b=speakers.get("b", "Person B"),
        overall=scores.get("overall_score", "N/A"),
        compat=scores.get("compatibility_score", "N/A"),
        tox=scores.get("toxicity_level", "N/A"),
        ghost=scores.get("ghosting_risk", "N/A"),
        attach=scores.get("attachment_style", "N/A"),
        patterns=", ".join(scores.get("patterns_detected", [])),
        narrative=scores.get("ai_narrative", "N/A"),
        insta=INSTAGRAM_HANDLE,
    )

    messages = [{"role": "system", "content": system}]
    messages.extend(conversation_history[-10:])
    messages.append({"role": "user", "content": message})

    content, provider, _ = await ai_router.complete(
        messages=messages,
        model_type="advisor",
        temperature=0.7,
        max_tokens=800,
    )
    logger.info(f"Advisor via {provider}")
    return content
