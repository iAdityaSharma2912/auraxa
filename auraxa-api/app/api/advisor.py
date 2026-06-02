from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
import json
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Analysis, AnalysisStatus
from app.services.ai_router import ai_router

router = APIRouter()
logger = logging.getLogger(__name__)

HISTORY_TTL = 60 * 60 * 24 * 7  # 7 days


def _redis():
    import redis as r
    from app.core.config import settings
    return r.from_url(settings.REDIS_URL, decode_responses=True)


def _key(analysis_id: str, user_id: str) -> str:
    return f"auraxa:advisor:{user_id}:{analysis_id}"


def _load_history(analysis_id: str, user_id: str) -> list:
    try:
        raw = _redis().get(_key(analysis_id, user_id))
        return json.loads(raw) if raw else []
    except Exception as e:
        logger.warning(f"Redis read failed: {e}")
        return []


def _save_history(analysis_id: str, user_id: str, history: list) -> None:
    try:
        _redis().setex(_key(analysis_id, user_id), HISTORY_TTL, json.dumps(history))
    except Exception as e:
        logger.warning(f"Redis write failed: {e}")


def _build_system_prompt(analysis: Analysis) -> str:
    scores = getattr(analysis, "scores", None)
    speakers = getattr(analysis, "speakers", {}) or {}
    speaker_a = speakers.get("a", "Person A")
    speaker_b = speakers.get("b", "Person B")

    context_parts = [
        f"You are the Auraxa AI Advisor — an emotionally intelligent assistant trained in relationship psychology, attachment theory, and communication dynamics.",
        f"",
        f"You have just analysed a conversation between {speaker_a} and {speaker_b}.",
        f"The user is asking for guidance based on this specific analysis.",
        f"",
        f"ANALYSIS CONTEXT:",
    ]

    if scores:
        def ev(val):
            return str(val.value) if hasattr(val, "value") else str(val or "unknown")

        context_parts += [
            f"- Overall Score: {scores.overall_score}/100",
            f"- Compatibility: {scores.compatibility_score}%",
            f"- Toxicity Level: {ev(scores.toxicity_level)}",
            f"- Ghosting Risk: {ev(scores.ghosting_risk)}",
            f"- Attachment Style: {scores.attachment_style or 'unknown'}",
            f"- Patterns Detected: {', '.join(scores.patterns_detected or []) or 'none'}",
        ]
        if scores.ai_narrative:
            context_parts += ["", f"AI NARRATIVE SUMMARY:", scores.ai_narrative[:800]]

    context_parts += [
        "",
        "ADVISOR RULES:",
        "- Be warm, direct, and grounded in the actual data above.",
        "- Use Gen Z-friendly language naturally — not forced. Be human.",
        "- Give specific, actionable advice. Not generic platitudes.",
        "- Reference the actual scores and patterns when relevant.",
        "- If someone is in distress, acknowledge their feelings first.",
        "- Keep responses concise — 2-4 short paragraphs max.",
        "- You can be honest even if the truth is uncomfortable.",
        "- Never diagnose or claim to be a real therapist.",
        "- If the question has nothing to do with relationships or the analysis, gently redirect.",
    ]

    return "\n".join(context_parts)


class MessageRequest(BaseModel):
    message: str


@router.get("/{analysis_id}")
async def get_conversation(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Load existing advisor conversation history."""
    # Verify ownership
    result = await db.execute(
        select(Analysis).where(
            Analysis.id == analysis_id,
            Analysis.user_id == current_user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Analysis not found.")

    history = _load_history(analysis_id, str(current_user.id))
    return {"messages": history}


@router.post("/{analysis_id}")
async def send_message(
    analysis_id: str,
    body: MessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message to the AI advisor and get a response."""
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Load analysis
    result = await db.execute(
        select(Analysis)
        .where(
            Analysis.id == analysis_id,
            Analysis.user_id == current_user.id,
        )
        .options(selectinload(Analysis.scores))
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    if analysis.status != AnalysisStatus.completed:
        raise HTTPException(status_code=400, detail="Analysis not yet complete.")

    # Build conversation
    system_prompt = _build_system_prompt(analysis)
    history = _load_history(analysis_id, str(current_user.id))

    # Add user message
    history.append({"role": "user", "content": body.message.strip()})

    # Trim history to last 20 messages to keep context window manageable
    recent = history[-20:]

    messages = [{"role": "system", "content": system_prompt}] + recent

    try:
        reply_text, provider = await ai_router.complete(
            messages=messages,
            model_type="analysis",
            temperature=0.75,
            max_tokens=600,
        )
        logger.info(f"Advisor reply via {provider} for {analysis_id}")
    except Exception as e:
        logger.error(f"Advisor AI call failed: {e}")
        raise HTTPException(status_code=500, detail="AI response failed. Please try again.")

    # Append assistant reply and save
    history.append({"role": "assistant", "content": reply_text.strip()})
    _save_history(analysis_id, str(current_user.id), history)

    return {
        "reply": reply_text.strip(),
        "messages": history,
    }


@router.delete("/{analysis_id}")
async def clear_conversation(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Clear conversation history for an analysis."""
    result = await db.execute(
        select(Analysis).where(
            Analysis.id == analysis_id,
            Analysis.user_id == current_user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Analysis not found.")

    try:
        _redis().delete(_key(analysis_id, str(current_user.id)))
    except Exception as e:
        logger.warning(f"Redis delete failed: {e}")

    return {"message": "Conversation cleared."}
