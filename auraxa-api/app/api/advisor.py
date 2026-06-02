import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User, Analysis, AnalysisStatus, AdvisorConversation
from app.schemas.schemas import AdvisorMessageRequest, AdvisorMessageResponse, AdvisorHistoryResponse
from app.services.ai_service import get_advisor_response

router = APIRouter()


def _check_advisor_limit(user: User) -> None:
    if user.subscription_tier.value == "free":
        raise HTTPException(
            status_code=402,
            detail="AI Advisor is a Premium feature. Please upgrade to access it."
        )
    if user.subscription_tier.value == "premium":
        if user.advisor_msgs_used_month >= settings.PREMIUM_ADVISOR_MSGS_PER_MONTH:
            raise HTTPException(
                status_code=402,
                detail=f"Monthly advisor message limit ({settings.PREMIUM_ADVISOR_MSGS_PER_MONTH}) reached."
            )


@router.post("/message", response_model=AdvisorMessageResponse)
async def send_message(
    body: AdvisorMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_advisor_limit(current_user)

    # Load analysis with scores
    result = await db.execute(
        select(Analysis)
        .where(Analysis.id == body.analysis_id, Analysis.user_id == current_user.id)
        .options(selectinload(Analysis.scores))
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    if analysis.status != AnalysisStatus.completed:
        raise HTTPException(status_code=400, detail="Analysis not yet completed.")

    # Load or create conversation session
    session_id = body.session_id
    conversation = None

    if session_id:
        conv_result = await db.execute(
            select(AdvisorConversation).where(
                AdvisorConversation.id == session_id,
                AdvisorConversation.user_id == current_user.id,
            )
        )
        conversation = conv_result.scalar_one_or_none()

    if not conversation:
        conversation = AdvisorConversation(
            user_id=current_user.id,
            analysis_id=body.analysis_id,
            messages=[],
        )
        db.add(conversation)
        await db.flush()

    # Build history for AI context
    history = [
        {"role": m["role"], "content": m["content"]}
        for m in (conversation.messages or [])[-10:]
    ]

    # Build analysis summary for system prompt
    scores = analysis.scores
    analysis_summary = {
        "speakers": analysis.speakers or {},
        "scores": {
            "overall_score": scores.overall_score if scores else 50,
            "compatibility_score": scores.compatibility_score if scores else 50,
            "toxicity_level": scores.toxicity_level.value if scores else "low",
            "ghosting_risk": scores.ghosting_risk.value if scores else "low",
            "attachment_style": scores.attachment_style.value if scores else "secure",
            "patterns_detected": scores.patterns_detected if scores else [],
            "ai_narrative": scores.ai_narrative if scores else "",
        } if scores else {},
    }

    # Get AI response
    ai_response = await get_advisor_response(body.message, history, analysis_summary)

    # Save messages
    messages = list(conversation.messages or [])
    messages.append({"role": "user", "content": body.message, "id": str(uuid.uuid4())})
    messages.append({"role": "assistant", "content": ai_response, "id": str(uuid.uuid4())})
    conversation.messages = messages
    conversation.message_count = len(messages)

    # Bump usage counter
    current_user.advisor_msgs_used_month += 1

    await db.commit()

    return AdvisorMessageResponse(response=ai_response, session_id=conversation.id)


@router.get("/{session_id}/history", response_model=AdvisorHistoryResponse)
async def get_history(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(AdvisorConversation).where(
            AdvisorConversation.id == session_id,
            AdvisorConversation.user_id == current_user.id,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation session not found.")

    return AdvisorHistoryResponse(
        session_id=conversation.id,
        messages=conversation.messages or [],
    )
