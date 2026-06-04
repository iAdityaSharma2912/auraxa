"""
analyze.py — results endpoint
Returns the full analysis data including the complete ai_result
stored in the full_report JSONB column.
"""
import json
import logging
import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, text
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import (
    Analysis, AnalysisStatus, EmotionalScore, TimelinePoint, Report, User
)
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = getattr(settings, "UPLOAD_DIR", "/tmp/auraxa_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Upload screenshot ─────────────────────────────────────

@router.post("/upload")
async def upload_analysis(
    files: list[UploadFile] = File(...),
    intent: str = Form("conversation"),
    input_type: str = Form("screenshot"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis_id = str(uuid.uuid4())
    file_paths  = []

    for uploaded in files[:3]:
        filename = uploaded.filename or ""
        ext = os.path.splitext(filename)[1].lower()

        # ── .txt files → read as text, skip OCR ──────────
        if ext == ".txt":
            content = await uploaded.read()
            text = content.decode("utf-8", errors="ignore").strip()
            if len(text) < 50:
                raise HTTPException(400, "Text file is too short (min 50 characters).")

            path = os.path.join(UPLOAD_DIR, f"{analysis_id}_text.txt")
            with open(path, "w", encoding="utf-8") as f:
                f.write(text)

            analysis = Analysis(
                id=analysis_id,
                user_id=current_user.id,
                status=AnalysisStatus.queued,
                input_type="paste",
                intent=intent,
            )
            db.add(analysis)
            await db.commit()

            from app.tasks.analysis_tasks import run_analysis_task
            run_analysis_task.delay(analysis_id, [path], "text", intent)
            return {"analysis_id": analysis_id, "status": "queued"}

        # ── image files → normal OCR path ─────────────────
        path = os.path.join(UPLOAD_DIR, f"{analysis_id}_{len(file_paths)}{ext or '.jpg'}")
        content = await uploaded.read()
        with open(path, "wb") as f:
            f.write(content)
        file_paths.append(path)

    if not file_paths:
        raise HTTPException(400, "No valid image files uploaded.")

    analysis = Analysis(
        id=analysis_id,
        user_id=current_user.id,
        status=AnalysisStatus.queued,
        input_type="screenshot",
        intent=intent,
    )
    db.add(analysis)
    await db.commit()

    from app.tasks.analysis_tasks import run_analysis_task
    run_analysis_task.delay(analysis_id, file_paths, "screenshot", intent)
    return {"analysis_id": analysis_id, "status": "queued"}

# ── Submit text ───────────────────────────────────────────

class TextAnalysisRequest(BaseModel):
    text: str
    intent: str = "conversation"


@router.post("")
async def submit_text_analysis(
    body: TextAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if len(body.text.strip()) < 50:
        raise HTTPException(400, "Paste at least 50 characters of conversation.")

    analysis_id = str(uuid.uuid4())

    # Write text to temp file
    path = os.path.join(UPLOAD_DIR, f"{analysis_id}_text.txt")
    with open(path, "w", encoding="utf-8") as f:
        f.write(body.text)

    analysis = Analysis(
        id=analysis_id,
        user_id=current_user.id,
        status=AnalysisStatus.queued,
        input_type="paste",
        intent=body.intent,
    )
    db.add(analysis)
    await db.commit()

    from app.tasks.analysis_tasks import run_analysis_task
    run_analysis_task.delay(analysis_id, [path], "text", body.intent)

    return {"analysis_id": analysis_id, "status": "queued"}


# ── Status ────────────────────────────────────────────────

@router.get("/{analysis_id}/status")
async def get_status(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Analysis).where(
            Analysis.id == analysis_id,
            Analysis.user_id == current_user.id,
        )
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(404, "Analysis not found.")

    return {
        "analysis_id": analysis_id,
        "status":      analysis.status.value if hasattr(analysis.status, "value") else analysis.status,
        "message_count": analysis.message_count,
    }


# ── FULL RESULTS ──────────────────────────────────────────
# This is the key endpoint — it merges:
#   1. Analysis metadata (speakers, date_range, message_count)
#   2. EmotionalScore (basic scores)
#   3. TimelinePoints
#   4. full_report JSONB (scoring_breakdown, sub_metrics, phases, etc.)

@router.get("/{analysis_id}/results")
async def get_results(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Fetch analysis
    res = await db.execute(
        select(Analysis).where(
            Analysis.id == analysis_id,
            Analysis.user_id == current_user.id,
        )
    )
    analysis = res.scalar_one_or_none()
    if not analysis:
        raise HTTPException(404, "Analysis not found.")

    status = analysis.status.value if hasattr(analysis.status, "value") else str(analysis.status)
    if status != "completed":
        raise HTTPException(400, f"Analysis is {status}, not completed.")

    # Fetch scores
    score_res = await db.execute(
        select(EmotionalScore).where(EmotionalScore.analysis_id == analysis_id)
    )
    score = score_res.scalar_one_or_none()
    if not score:
        raise HTTPException(404, "Score data not found.")

    # Fetch timeline
    tl_res = await db.execute(
        select(TimelinePoint)
        .where(TimelinePoint.analysis_id == analysis_id)
        .order_by(TimelinePoint.sequence_index)
    )
    timeline_points = tl_res.scalars().all()

    # Fetch full_report JSONB
    full_report: dict = {}
    try:
        fr_res = await db.execute(
            text("SELECT full_report FROM analyses WHERE id = :id"),
            {"id": analysis_id},
        )
        row = fr_res.fetchone()
        if row and row[0]:
            raw = row[0]
            if isinstance(raw, str):
                full_report = json.loads(raw)
            elif isinstance(raw, dict):
                full_report = raw
    except Exception as e:
        logger.warning(f"Could not fetch full_report for {analysis_id}: {e}")

    # Build scores dict
    scores = {
        "overall_score":        score.overall_score,
        "compatibility_score":  score.compatibility_score,
        "communication_balance": score.communication_balance,
        "speaker_a_percentage": score.speaker_a_percentage,
        "speaker_b_percentage": score.speaker_b_percentage,
        "toxicity_level":       _enum_val(score.toxicity_level),
        "ghosting_risk":        _enum_val(score.ghosting_risk),
        "attachment_style":     _enum_val(score.attachment_style),
        "patterns_detected":    score.patterns_detected or [],
        "ai_narrative":         score.ai_narrative or "",
    }

    # Build timeline
    timeline = [
        {
            "timestamp":           tp.timestamp,
            "emotional_intensity": tp.emotional_intensity,
            "sentiment":           tp.sentiment,
            "speaker":             tp.speaker,
        }
        for tp in timeline_points
    ]

    # Merge everything — full_report fields are spread at top level
    # so the frontend can access result.scoring_breakdown,
    # result.sub_metrics, result.conversation_phases, etc. directly
    return {
        "id":            analysis_id,
        "status":        "completed",
        "speakers":      analysis.speakers or {"a": "Person A", "b": "Person B"},
        "message_count": analysis.message_count,
        "date_range":    analysis.date_range,
        "genz_verdict":  getattr(analysis, "genz_verdict", None) or full_report.get("genz_verdict"),
"card_variant":  getattr(analysis, "card_variant", None),
        "scores":        scores,
        "ai_narrative":  score.ai_narrative or "",
        "timeline":      timeline,
        # ── Rich AI sections from full_report ──────────
        "scoring_breakdown":              full_report.get("scoring_breakdown"),
        "sub_metrics":                    full_report.get("sub_metrics"),
        "hard_truths":                    full_report.get("hard_truths", []),
        "key_topics":                     full_report.get("key_topics", []),
        "conversation_phases":            full_report.get("conversation_phases", []),
        "conversation_themes":            full_report.get("conversation_themes"),
        "peak_moments":                   full_report.get("peak_moments"),
        "emotional_moments":              full_report.get("emotional_moments"),
        "communication_analysis":         full_report.get("communication_analysis"),
        "red_flags":                      full_report.get("red_flags", []),
        "green_flags":                    full_report.get("green_flags", []),
        "relationship_health_indicators": full_report.get("relationship_health_indicators"),
        "roast":                          full_report.get("roast"),
        "astrology_reading":              full_report.get("astrology_reading"),
        "what_this_reveals":              full_report.get("what_this_reveals"),
        "therapist_note":                 full_report.get("therapist_note"),
    }


# ── List user's analyses ──────────────────────────────────

@router.get("")
async def list_analyses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = await db.execute(
        select(Analysis, EmotionalScore)
        .outerjoin(EmotionalScore, EmotionalScore.analysis_id == Analysis.id)
        .where(Analysis.user_id == current_user.id)
        .order_by(Analysis.created_at.desc())
        .limit(50)
    )
    rows = res.all()

    analyses = []
    for analysis, score in rows:
        status = analysis.status.value if hasattr(analysis.status, "value") else str(analysis.status)
        entry = {
            "id":            analysis.id,
            "status":        status,
            "speakers":      analysis.speakers or {"a": "Person A", "b": "Person B"},
            "created_at":    analysis.created_at.isoformat() if analysis.created_at else None,
            "message_count": analysis.message_count,
            "genz_verdict":  getattr(analysis, "genz_verdict", None),
"card_variant":  getattr(analysis, "card_variant", None),
        }
        if score:
            entry["scores"] = {
                "overall_score":       score.overall_score,
                "compatibility_score": score.compatibility_score,
                "toxicity_level":      _enum_val(score.toxicity_level),
                "ghosting_risk":       _enum_val(score.ghosting_risk),
                "attachment_style":    _enum_val(score.attachment_style),
                "patterns_detected":   score.patterns_detected or [],
            }
        analyses.append(entry)

    return {"analyses": analyses}


# ── Delete ────────────────────────────────────────────────

@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = await db.execute(
        select(Analysis).where(
            Analysis.id == analysis_id,
            Analysis.user_id == current_user.id,
        )
    )
    analysis = res.scalar_one_or_none()
    if not analysis:
        raise HTTPException(404, "Analysis not found.")

    await db.execute(delete(EmotionalScore).where(EmotionalScore.analysis_id == analysis_id))
    await db.execute(delete(TimelinePoint).where(TimelinePoint.analysis_id == analysis_id))
    await db.execute(delete(Report).where(Report.analysis_id == analysis_id))
    await db.execute(delete(Analysis).where(Analysis.id == analysis_id))
    await db.commit()

    return {"deleted": True}


# ── Advisor summary endpoint (used by AI advisor) ─────────

@router.get("/{analysis_id}/summary")
async def get_summary(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = await db.execute(
        select(Analysis, EmotionalScore)
        .outerjoin(EmotionalScore, EmotionalScore.analysis_id == Analysis.id)
        .where(Analysis.id == analysis_id, Analysis.user_id == current_user.id)
    )
    row = res.first()
    if not row:
        raise HTTPException(404, "Analysis not found.")

    analysis, score = row
    return {
        "speakers": analysis.speakers,
        "scores": {
            "overall_score":       score.overall_score if score else None,
            "compatibility_score": score.compatibility_score if score else None,
            "toxicity_level":      _enum_val(score.toxicity_level) if score else None,
            "ghosting_risk":       _enum_val(score.ghosting_risk) if score else None,
            "attachment_style":    _enum_val(score.attachment_style) if score else None,
            "patterns_detected":   score.patterns_detected if score else [],
            "ai_narrative":        score.ai_narrative if score else "",
        },
    }


# ── Helper ────────────────────────────────────────────────

def _enum_val(v) -> Optional[str]:
    if v is None:
        return None
    return v.value if hasattr(v, "value") else str(v)
