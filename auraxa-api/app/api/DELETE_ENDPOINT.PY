# ─────────────────────────────────────────────────────────
# ADD THIS TO auraxa-api/app/api/analyze.py
# Paste at the bottom of the file
# ─────────────────────────────────────────────────────────

@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Permanently delete an analysis and all related data."""
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

    # Delete related records first (cascade if not set in model)
    try:
        await db.execute(sql_delete(EmotionalScore).where(EmotionalScore.analysis_id == analysis_id))
        await db.execute(sql_delete(TimelinePoint).where(TimelinePoint.analysis_id == analysis_id))
        await db.execute(sql_delete(Report).where(Report.analysis_id == analysis_id))
    except Exception:
        pass  # Tables may not exist or cascade handles it

    await db.delete(analysis)
    await db.commit()

    # Clear advisor history from Redis
    try:
        import redis as r
        from app.core.config import settings
        rc = r.from_url(settings.REDIS_URL, decode_responses=True)
        rc.delete(f"auraxa:advisor:{current_user.id}:{analysis_id}")
    except Exception:
        pass

    return {"message": "Analysis deleted.", "id": analysis_id}
