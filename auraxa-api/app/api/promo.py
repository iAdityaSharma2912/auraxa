"""
Promo Code API
--------------
Secret codes that grant Pro tier access instantly.
Codes are defined in .env as PROMO_CODES=CODE1,CODE2,...
Each user can only redeem a given code once.
Admins can see all redemptions.
"""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User, SubscriptionTier

router = APIRouter()


class RedeemRequest(BaseModel):
    code: str


class RedeemResponse(BaseModel):
    success: bool
    message: str
    tier: str


@router.post("/redeem", response_model=RedeemResponse)
async def redeem_promo_code(
    body: RedeemRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    code = body.code.strip().upper()

    # Check if valid code
    if not settings.is_valid_promo(code):
        raise HTTPException(
            status_code=400,
            detail="Invalid promo code. Check spelling and try again.",
        )

    # Check if user already used this code
    # We store used codes in the user's promo_codes_used field
    used_codes = current_user.promo_codes_used or []
    if code in [c.upper() for c in used_codes]:
        raise HTTPException(
            status_code=409,
            detail="You've already redeemed this code.",
        )

    # Grant Pro tier
    current_user.subscription_tier = SubscriptionTier.pro
    current_user.subscription_expires_at = None  # Unlimited — no expiry
    current_user.analyses_used_month = 0
    current_user.advisor_msgs_used_month = 0

    # Mark code as used
    current_user.promo_codes_used = used_codes + [code]

    await db.commit()

    return RedeemResponse(
        success=True,
        message=f"Code redeemed! You now have unlimited Pro access.",
        tier="pro",
    )


@router.get("/validate/{code}")
async def validate_code(code: str):
    """Public endpoint to check if a code exists (doesn't reveal which codes are valid)."""
    is_valid = settings.is_valid_promo(code)
    return {"valid": is_valid}
