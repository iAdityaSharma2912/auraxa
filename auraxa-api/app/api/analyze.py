import os
import uuid
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User, Analysis, AnalysisStatus, InputType, AnalysisIntent
from app.schemas.schemas import UploadResponse, AnalysisStatusResponse, AnalysisResponse

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = "/tmp/auraxa_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".heic", ".webp", ".txt", ".json"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def _check_tier_limit(user: User) -> None:
    limits = {
        "free":    settings.FREE_ANALYSES_PER_MONTH,
        "premium": settings.PREMIUM_ANALYSES_PER_MONTH,
        "pro":     999999,
    }
    limit = limits.get(user.subscription_tier.value, 3)
    if user.analyses_used_month >= limit:
        raise HTTPException(
            status_code=402,
            detail=f"Monthly limit of {limit} analyses reached. Please upgrade your plan.",
        )


# ─── Paste endpoint (text input) ──────────────────────────────
class PasteRequest(BaseModel):
    text: str
    intent: str = "conversation"


@router.post("/paste", response_model=UploadResponse)
async def paste_conversation(
    body: PasteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept raw pasted text and run analysis without OCR step."""
    _check_tier_limit(current_user)

    if len(body.text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Text too short. Paste at least a few messages.")
    if len(body.text) > 50_000:
        raise HTTPException(status_code=400, detail="Text too long. Maximum 50,000 characters.")

    # Save pasted text to a temp file
    file_id = str(uuid.uuid4())
    path = os.path.join(UPLOAD_DIR, f"{file_id}.txt")
    with open(path, "w", encoding="utf-8") as f:
        f.write(body.text)

    intent = AnalysisIntent(body.intent) if body.intent in AnalysisIntent.__members__ else AnalysisIntent.conversation

    analysis = Analysis(
        user_id=current_user.id,
        status=AnalysisStatus.queued,
        input_type=InputType.text_export,
        intent=intent,
        file_paths=[path],
    )
    db.add(analysis)
    current_user.analyses_used_month += 1
    await db.commit()
    await db.refresh(analysis)

    # Dispatch Celery task
    from app.tasks.analysis_tasks import run_analysis_task
    task = run_analysis_task.delay(
        analysis_id=analysis.id,
        file_paths=[path],
        input_type="text_export",
        intent=intent.value,
    )
    analysis.celery_task_id = task.id
    await db.commit()

    return UploadResponse(analysis_id=analysis.id, status="queued")


# ─── File upload endpoint ─────────────────────────────────────
@router.post("/upload", response_model=UploadResponse)
async def upload_conversation(
    files: List[UploadFile] = File(...),
    intent: str = Form("conversation"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_tier_limit(current_user)

    if len(files) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 files allowed per analysis.")

    saved_paths = []
    for upload in files:
        ext = os.path.splitext(upload.filename or "file")[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"File type {ext} not supported.")
        content = await upload.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"{upload.filename} exceeds 10MB limit.")
        file_id = str(uuid.uuid4())
        path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
        with open(path, "wb") as f:
            f.write(content)
        saved_paths.append(path)

    # Detect input type
    first_ext = os.path.splitext(saved_paths[0])[1].lower() if saved_paths else ".jpg"
    if first_ext == ".txt":
        input_type = InputType.text_export
    elif first_ext == ".json":
        input_type = InputType.json_export
    else:
        input_type = InputType.screenshot

    intent_enum = AnalysisIntent(intent) if intent in AnalysisIntent.__members__ else AnalysisIntent.conversation

    analysis = Analysis(
        user_id=current_user.id,
        status=AnalysisStatus.queued,
        input_type=input_type,
        intent=intent_enum,
        file_paths=saved_paths,
    )
    db.add(analysis)
    current_user.analyses_used_month += 1
    await db.commit()
    await db.refresh(analysis)

    from app.tasks.analysis_tasks import run_analysis_task
    task = run_analysis_task.delay(
        analysis_id=analysis.id,
        file_paths=saved_paths,
        input_type=input_type.value,
        intent=intent_enum.value,
    )
    analysis.celery_task_id = task.id
    await db.commit()

    return UploadResponse(analysis_id=analysis.id, status="queued")


# ─── Status ───────────────────────────────────────────────────
@router.get("/{analysis_id}/status", response_model=AnalysisStatusResponse)
async def get_status(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Analysis).where(Analysis.id == analysis_id, Analysis.user_id == current_user.id)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    step_map = {
        "queued":     "Waiting in queue...",
        "processing": "Analysing your conversation...",
        "completed":  "Complete",
        "failed":     "Analysis failed",
    }
    return AnalysisStatusResponse(
        id=analysis.id,
        status=analysis.status.value,
        step=step_map.get(analysis.status.value),
        progress=100 if analysis.status == AnalysisStatus.completed else None,
        error=analysis.error_message,
    )


# ─── Results ──────────────────────────────────────────────────
@router.get("/{analysis_id}/results", response_model=AnalysisResponse)
async def get_results(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Analysis)
        .where(Analysis.id == analysis_id, Analysis.user_id == current_user.id)
        .options(selectinload(Analysis.scores), selectinload(Analysis.timeline))
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    if analysis.status == AnalysisStatus.failed:
        raise HTTPException(status_code=422, detail=analysis.error_message or "Analysis failed.")
    if analysis.status != AnalysisStatus.completed:
        raise HTTPException(status_code=202, detail="Analysis not yet complete.")
    return analysis


# ─── List ─────────────────────────────────────────────────────
# REPLACE with:
@router.get("", response_model=List[AnalysisResponse])
async def list_analyses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Analysis)
        .where(Analysis.user_id == current_user.id)
        .options(
            selectinload(Analysis.scores),
            selectinload(Analysis.timeline),
        )
        .order_by(Analysis.created_at.desc())
        .limit(20)
    )
    return list(result.scalars().all())


from sqlalchemy import delete as sql_delete
from app.models.user import EmotionalScore, TimelinePoint, Report

@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import delete as sql_delete

    result = await db.execute(
        select(Analysis).where(
            Analysis.id == analysis_id,
            Analysis.user_id == current_user.id,
        )
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    # Delete related rows
    try:
        from app.models.user import EmotionalScore, TimelinePoint, Report
        await db.execute(sql_delete(EmotionalScore).where(EmotionalScore.analysis_id == analysis_id))
        await db.execute(sql_delete(TimelinePoint).where(TimelinePoint.analysis_id == analysis_id))
        await db.execute(sql_delete(Report).where(Report.analysis_id == analysis_id))
    except Exception:
        pass

    await db.delete(analysis)
    await db.commit()

    # Clear Redis advisor history
    try:
        import redis as r
        from app.core.config import settings
        rc = r.from_url(settings.REDIS_URL, decode_responses=True)
        rc.delete(f"auraxa:advisor:{current_user.id}:{analysis_id}")
    except Exception:
        pass

    return {"message": "Analysis deleted.", "id": analysis_id}