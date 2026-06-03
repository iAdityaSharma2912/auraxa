"""Admin API — real token tracking, system health, user management."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, text
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Analysis, AnalysisStatus
from app.core.config import settings
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

INPUT_COST_PER_M  = 0.15
OUTPUT_COST_PER_M = 0.60


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    admin_emails = [e.strip().lower() for e in (settings.ADMIN_EMAILS or "").split(",") if e.strip()]
    if (current_user.email or "").lower() not in admin_emails:
        raise HTTPException(status_code=403, detail="Admin access required.")
    return current_user


def calc_cost(input_t: int, output_t: int) -> float:
    return round(
        (input_t / 1_000_000) * INPUT_COST_PER_M +
        (output_t / 1_000_000) * OUTPUT_COST_PER_M,
        6,
    )


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    now       = datetime.utcnow()
    week_ago  = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    total_users    = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
    total_analyses = (await db.execute(select(func.count()).select_from(Analysis))).scalar() or 0
    completed      = (await db.execute(select(func.count()).select_from(Analysis).where(
        Analysis.status == AnalysisStatus.completed))).scalar() or 0
    failed         = (await db.execute(select(func.count()).select_from(Analysis).where(
        Analysis.status == AnalysisStatus.failed))).scalar() or 0
    processing     = (await db.execute(select(func.count()).select_from(Analysis).where(
        Analysis.status == AnalysisStatus.processing))).scalar() or 0

    new_users_week     = (await db.execute(select(func.count()).select_from(User).where(
        User.created_at >= week_ago))).scalar() or 0
    new_analyses_week  = (await db.execute(select(func.count()).select_from(Analysis).where(
        Analysis.created_at >= week_ago))).scalar() or 0
    new_analyses_month = (await db.execute(select(func.count()).select_from(Analysis).where(
        Analysis.created_at >= month_ago))).scalar() or 0

    # Subscription breakdown
    tier_counts = {}
    for tier in ["free", "premium", "pro"]:
        cnt = (await db.execute(
            select(func.count()).select_from(User).where(User.subscription_tier == tier)
        )).scalar() or 0
        tier_counts[tier] = cnt

    # ── Real token data ──────────────────────────────────
    has_token_cols = True
    try:
        tok_res = await db.execute(
            select(
                func.coalesce(func.sum(text("tokens_input")), 0),
                func.coalesce(func.sum(text("tokens_output")), 0),
                func.coalesce(func.sum(text("tokens_total")), 0),
            ).select_from(Analysis).where(Analysis.status == AnalysisStatus.completed)
        )
        row = tok_res.fetchone()
        total_input_tokens  = int(row[0])
        total_output_tokens = int(row[1])
        total_tokens        = int(row[2])

        # Week tokens
        week_tok = await db.execute(
            select(
                func.coalesce(func.sum(text("tokens_input")), 0),
                func.coalesce(func.sum(text("tokens_output")), 0),
            ).select_from(Analysis).where(
                Analysis.status == AnalysisStatus.completed,
                Analysis.created_at >= week_ago,
            )
        )
        week_row = week_tok.fetchone()
        week_input  = int(week_row[0])
        week_output = int(week_row[1])
        week_tokens = week_input + week_output
        data_source = "real"

    except Exception:
        # Columns don't exist yet — fall back to estimates
        has_token_cols = False
        AVG_IN, AVG_OUT = 3500, 800
        total_input_tokens  = completed * AVG_IN
        total_output_tokens = completed * AVG_OUT
        total_tokens        = total_input_tokens + total_output_tokens
        week_input  = new_analyses_week * AVG_IN
        week_output = new_analyses_week * AVG_OUT
        week_tokens = week_input + week_output
        data_source = "estimated"

    total_cost  = calc_cost(total_input_tokens, total_output_tokens)
    week_cost   = calc_cost(week_input, week_output)
    avg_per     = round(total_tokens / completed) if completed else 0

    # Daily sparkline (14 days)
    daily = []
    for i in range(13, -1, -1):
        day_start = now - timedelta(days=i+1)
        day_end   = now - timedelta(days=i)
        cnt = (await db.execute(
            select(func.count()).select_from(Analysis).where(
                Analysis.created_at >= day_start,
                Analysis.created_at < day_end,
            )
        )).scalar() or 0
        daily.append({"date": day_start.strftime("%d %b"), "count": cnt})

    return {
        "users": {
            "total": total_users,
            "new_week": new_users_week,
            "tiers": tier_counts,
        },
        "analyses": {
            "total": total_analyses,
            "completed": completed,
            "failed": failed,
            "processing": processing,
            "new_week": new_analyses_week,
            "new_month": new_analyses_month,
            "success_rate": round((completed / total_analyses * 100) if total_analyses else 0, 1),
            "daily": daily,
        },
        "tokens": {
            "total_input": total_input_tokens,
            "total_output": total_output_tokens,
            "total": total_tokens,
            "total_cost_usd": total_cost,
            "week_tokens": week_tokens,
            "week_cost_usd": week_cost,
            "avg_per_analysis": avg_per,
            "model": "openai/gpt-4o-mini (via openrouter)",
            "data_source": data_source,
            "note": "Live from API" if has_token_cols else "Estimated — run migrate_tokens.py for real data",
        },
    }


@router.get("/health")
async def get_health(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    results = {}

    try:
        await db.execute(text("SELECT 1"))
        results["database"] = {"status": "ok"}
    except Exception as e:
        results["database"] = {"status": "error", "error": str(e)}

    try:
        import time
        import redis as r
        rc = r.from_url(settings.REDIS_URL, decode_responses=True, socket_timeout=2)
        t0 = time.time()
        rc.ping()
        latency = round((time.time() - t0) * 1000, 1)
        info    = rc.info("server")
        results["redis"] = {
            "status": "ok",
            "latency_ms": latency,
            "version": info.get("redis_version"),
            "memory": info.get("used_memory_human"),
        }
    except Exception as e:
        results["redis"] = {"status": "error", "error": str(e)}

    try:
        import redis as r
        rc = r.from_url(settings.REDIS_URL, decode_responses=True, socket_timeout=2)
        queue_len = rc.llen("celery")
        results["worker"] = {"status": "ok", "queue_length": queue_len}
    except Exception as e:
        results["worker"] = {"status": "unknown", "error": str(e)}

    overall = "ok" if all(v["status"] == "ok" for v in results.values()) else "degraded"
    return {"overall": overall, "services": results, "checked_at": datetime.utcnow().isoformat()}


@router.get("/users")
async def get_users(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(
        select(User).order_by(desc(User.created_at)).limit(limit).offset(offset)
    )
    users = result.scalars().all()
    rows  = []
    for u in users:
        count_res = await db.execute(
            select(func.count()).select_from(Analysis).where(Analysis.user_id == u.id)
        )
        analysis_count = count_res.scalar() or 0

        # Try real tokens first, fall back to estimate
        try:
            ut = await db.execute(
                select(
                    func.coalesce(func.sum(text("tokens_input")), 0),
                    func.coalesce(func.sum(text("tokens_output")), 0),
                ).select_from(Analysis).where(
                    Analysis.user_id == u.id,
                    Analysis.status == AnalysisStatus.completed,
                )
            )
            ur = ut.fetchone()
            user_input  = int(ur[0])
            user_output = int(ur[1])
        except Exception:
            user_input  = analysis_count * 3500
            user_output = analysis_count * 800

        user_tokens = user_input + user_output
        user_cost   = calc_cost(user_input, user_output)

        rows.append({
            "id":                str(u.id),
            "name":              u.name,
            "email":             u.email,
            "subscription_tier": u.subscription_tier,
            "analyses_count":    analysis_count,
            "tokens_used":       user_tokens,
            "cost_usd":          user_cost,
            "created_at":        u.created_at.isoformat() if u.created_at else None,
        })

    total = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
    return {"users": rows, "total": total}


@router.get("/analyses")
async def get_analyses(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(
        select(Analysis).order_by(desc(Analysis.created_at)).limit(limit).offset(offset)
    )
    analyses = result.scalars().all()
    rows = []
    for a in analyses:
        user_res = await db.execute(select(User).where(User.id == a.user_id))
        user     = user_res.scalar_one_or_none()

        # Real tokens if available
        t_in  = getattr(a, "tokens_input",  0) or 0
        t_out = getattr(a, "tokens_output", 0) or 0
        t_tot = getattr(a, "tokens_total",  0) or 0
        if t_tot == 0 and a.status == AnalysisStatus.completed:
            # Fallback estimate
            t_in  = 3500 + (a.message_count or 0) * 12
            t_out = 800
            t_tot = t_in + t_out

        rows.append({
            "id":            str(a.id),
            "status":        a.status.value if hasattr(a.status, "value") else str(a.status),
            "speakers":      a.speakers or {},
            "message_count": a.message_count,
            "created_at":    a.created_at.isoformat() if a.created_at else None,
            "user_email":    user.email if user else "—",
            "user_name":     user.name if user else "—",
            "tokens_input":  t_in,
            "tokens_output": t_out,
            "tokens":        t_tot,
            "cost_usd":      calc_cost(t_in, t_out),
        })

    total = (await db.execute(select(func.count()).select_from(Analysis))).scalar() or 0
    return {"analyses": rows, "total": total}


@router.delete("/analyses/{analysis_id}")
async def admin_delete_analysis(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    from sqlalchemy import delete as sql_delete
    from app.models.user import EmotionalScore, TimelinePoint, Report

    result   = await db.execute(select(Analysis).where(Analysis.id == analysis_id))
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(404, "Analysis not found.")

    try:
        await db.execute(sql_delete(EmotionalScore).where(EmotionalScore.analysis_id == analysis_id))
        await db.execute(sql_delete(TimelinePoint).where(TimelinePoint.analysis_id == analysis_id))
        await db.execute(sql_delete(Report).where(Report.analysis_id == analysis_id))
    except Exception:
        pass

    await db.delete(analysis)
    await db.commit()
    return {"message": "Deleted.", "id": analysis_id}
