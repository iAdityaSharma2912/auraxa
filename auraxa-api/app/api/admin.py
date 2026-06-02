from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User, Analysis, AnalysisStatus
from app.services.ai_router import ai_router

router = APIRouter()


def _check_admin(user: User) -> None:
    if not settings.is_admin(user.email):
        raise HTTPException(status_code=403, detail="Admin access required.")


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_admin(current_user)

    total_users = await db.scalar(select(func.count(User.id)))

    tier_counts = {}
    for tier in ["free", "premium", "pro"]:
        count = await db.scalar(
            select(func.count(User.id)).where(User.subscription_tier == tier)
        )
        tier_counts[tier] = count

    total_analyses = await db.scalar(select(func.count(Analysis.id)))
    completed = await db.scalar(
        select(func.count(Analysis.id)).where(Analysis.status == AnalysisStatus.completed)
    )
    failed = await db.scalar(
        select(func.count(Analysis.id)).where(Analysis.status == AnalysisStatus.failed)
    )

    recent_result = await db.execute(
        select(User).order_by(User.created_at.desc()).limit(10)
    )
    recent_users = [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "tier": u.subscription_tier.value,
            "analyses_used": u.analyses_used_month,
            "promo_codes_used": u.promo_codes_used or [],
            "joined": u.created_at.isoformat(),
        }
        for u in recent_result.scalars().all()
    ]

    analyses_result = await db.execute(
        select(Analysis).order_by(Analysis.created_at.desc()).limit(10)
    )
    recent_analyses = [
        {
            "id": a.id,
            "user_id": a.user_id,
            "status": a.status.value,
            "intent": a.intent.value,
            "message_count": a.message_count,
            "created_at": a.created_at.isoformat(),
        }
        for a in analyses_result.scalars().all()
    ]

    return {
        "users": {"total": total_users, "by_tier": tier_counts},
        "analyses": {
            "total": total_analyses,
            "completed": completed,
            "failed": failed,
            "success_rate": round((completed / total_analyses * 100) if total_analyses else 0, 1),
        },
        "recent_users": recent_users,
        "recent_analyses": recent_analyses,
        "promo_codes": settings.get_promo_codes(),
    }


@router.get("/providers")
async def get_provider_health(
    current_user: User = Depends(get_current_user),
):
    """Live AI provider health status — available to all logged-in users."""
    health = ai_router.get_health()
    active = ai_router.get_active_provider_names()
    return {
        "priority_order": active,
        "providers": health,
    }


@router.post("/users/{user_id}/set-tier")
async def set_user_tier(
    user_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_admin(current_user)
    tier = body.get("tier", "free")
    if tier not in ("free", "premium", "pro"):
        raise HTTPException(status_code=400, detail="Invalid tier.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.subscription_tier = tier
    user.analyses_used_month = 0
    await db.commit()
    return {"success": True, "user_id": user_id, "new_tier": tier}


@router.post("/users/{user_id}/reset-usage")
async def reset_usage(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_admin(current_user)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.analyses_used_month = 0
    user.advisor_msgs_used_month = 0
    await db.commit()
    return {"success": True, "message": "Usage reset."}
