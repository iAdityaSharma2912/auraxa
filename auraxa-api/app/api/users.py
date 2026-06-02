from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()


class UpdateProfileRequest(BaseModel):
    name:     Optional[str] = None
    bio:      Optional[str] = None
    dob:      Optional[str] = None
    location: Optional[str] = None
    gender:   Optional[str] = None


@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_user),
):
    meta = getattr(current_user, "profile_meta", {}) or {}
    return {
        "id":                       current_user.id,
        "email":                    current_user.email,
        "name":                     current_user.name,
        "avatar_url":               current_user.avatar_url,
        "subscription_tier":        current_user.subscription_tier.value,
        "analyses_used_month":      current_user.analyses_used_month,
        "advisor_msgs_used_month":  current_user.advisor_msgs_used_month,
        "created_at":               current_user.created_at.isoformat(),
        "bio":                      meta.get("bio"),
        "dob":                      meta.get("dob"),
        "location":                 meta.get("location"),
        "gender":                   meta.get("gender"),
    }


@router.put("/me")
async def update_profile(
    body: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.name is not None:
        current_user.name = body.name.strip()

    meta = dict(getattr(current_user, "profile_meta", {}) or {})
    if body.bio      is not None: meta["bio"]      = body.bio
    if body.dob      is not None: meta["dob"]      = body.dob
    if body.location is not None: meta["location"] = body.location
    if body.gender   is not None: meta["gender"]   = body.gender

    try:
        current_user.profile_meta = meta
    except AttributeError:
        pass

    await db.commit()
    await db.refresh(current_user)
    return {"success": True, "name": current_user.name}