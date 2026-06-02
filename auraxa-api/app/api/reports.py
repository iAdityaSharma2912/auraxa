from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Report, Analysis
from app.schemas.schemas import ReportResponse, ShareReportResponse

router = APIRouter()


@router.get("", response_model=List[ReportResponse])
async def list_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Report)
        .where(Report.user_id == current_user.id)
        .options(
            selectinload(Report.analysis).selectinload(Analysis.scores),
            selectinload(Report.analysis).selectinload(Analysis.timeline),
        )
        .order_by(Report.created_at.desc())
        .limit(50)
    )
    return list(result.scalars().all())


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Report)
        .where(Report.id == report_id, Report.user_id == current_user.id)
        .options(
            selectinload(Report.analysis).selectinload(Analysis.scores),
            selectinload(Report.analysis).selectinload(Analysis.timeline),
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return report


@router.post("/{report_id}/share", response_model=ShareReportResponse)
async def share_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == current_user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    report.is_public = True
    await db.commit()

    base_url = "https://auraxa.app"
    share_url = f"{base_url}/r/{report.share_token}"
    return ShareReportResponse(share_url=share_url, card_url=report.card_url)


@router.get("/public/{share_token}")
async def get_public_report(share_token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Report)
        .where(Report.share_token == share_token, Report.is_public == True)  # noqa
        .options(
            selectinload(Report.analysis).selectinload(Analysis.scores),
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found or not public.")

    report.view_count += 1
    await db.commit()
    return report
