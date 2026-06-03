"""Gen Z verdict service — score → slang + AI copy generation."""
from __future__ import annotations
import logging

logger = logging.getLogger(__name__)


def score_to_variant(score: int) -> str:
    if score >= 75: return "slay"
    if score >= 60: return "healing"
    if score >= 35: return "mid"
    return "cooked"


def score_to_fallback_slang(score: int, toxicity: str = "low", ghosting: str = "low") -> str:
    if score >= 90: return "slay coded, main character era fr. understood the assignment no cap"
    if score >= 75: return "ate and left no crumbs bestie. W rizz confirmed, slay cosmic era"
    if score >= 60:
        if ghosting.lower() == "low":
            return "healing arc unlocked. the effort is there, just gotta communicate bestie"
        return "healing arc initiated but mercury said slow down. keep going tho"
    if score >= 45:
        if toxicity.lower() in ("high", "critical"):
            return "mid honestly ngl, the ick is lurking. toxicity receipts are filed bestie"
        return "it's giving situationship energy. potential is there but we need to talk"
    if score >= 30: return "bestie the ick has entered the chat. this might be your villain origin story"
    return "run. block. heal. that's the entire action plan bestie, we're cooked fr"


SYSTEM_PROMPT = """You are Auraxa's Gen Z verdict writer. Write ONE punchy 1-2 sentence Gen Z verdict for a relationship analysis.

Rules:
- Use Gen Z slang naturally: situationship, main character, ick, slay, bestie, fr, no cap, ate no crumbs, healing arc, cooked, mid, W rizz, delulu, hot and cold, villain origin story
- Tone matches score: slay (75+) = hype, healing (60-74) = cautiously optimistic, mid (35-59) = honest, cooked (<35) = blunt
- Always data-grounded — reference the patterns
- Return ONLY the verdict text, no quotes, no preamble"""


async def generate_genz_verdict(score: int, compatibility: int, toxicity: str,
    ghosting_risk: str, patterns: list, ai_router=None) -> str:
    if not ai_router:
        return score_to_fallback_slang(score, toxicity, ghosting_risk)
    prompt = (
        f"Score: {score}/100\nCompatibility: {compatibility}%\n"
        f"Toxicity: {toxicity}\nGhosting risk: {ghosting_risk}\n"
        f"Patterns: {', '.join(patterns[:4]) if patterns else 'none'}\n\nWrite the Gen Z verdict."
    )
    try:
        content, provider, _usage = await ai_router.complete(
            messages=[{"role":"system","content":SYSTEM_PROMPT},{"role":"user","content":prompt}],
            model_type="analysis", temperature=0.8, max_tokens=120,
        )
        verdict = content.strip().strip('"').strip("'")
        logger.info(f"Gen Z verdict via {provider}: {verdict[:60]}...")
        return verdict
    except Exception as e:
        logger.warning(f"Gen Z AI verdict failed, using fallback: {e}")
        return score_to_fallback_slang(score, toxicity, ghosting_risk)