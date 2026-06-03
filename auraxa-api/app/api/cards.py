from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Analysis, AnalysisStatus
from app.services.genz_service import score_to_variant, score_to_fallback_slang
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def _ev(val) -> str:
    return str(val.value) if hasattr(val, "value") else str(val or "low")

@router.get("/{analysis_id}")
async def get_card(analysis_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Analysis).where(Analysis.id == analysis_id, Analysis.user_id == current_user.id))
    analysis = result.scalar_one_or_none()
    if not analysis: raise HTTPException(404, "Analysis not found.")
    if analysis.status != AnalysisStatus.completed: raise HTTPException(202, "Not complete yet.")
    scores = getattr(analysis, "scores", None)
    if not scores: raise HTTPException(404, "No scores found.")
    overall, tox, ghost, compat = scores.overall_score, _ev(scores.toxicity_level), _ev(scores.ghosting_risk), scores.compatibility_score
    verdict = getattr(analysis, "genz_verdict", None) or score_to_fallback_slang(overall, tox, ghost)
    variant = getattr(analysis, "card_variant", None) or score_to_variant(overall)
    return {"analysis_id": analysis_id, "variant": variant, "verdict": verdict, "score": overall, "compatibility": compat, "toxicity": tox, "ghosting_risk": ghost, "speakers": getattr(analysis, "speakers", {}) or {}}