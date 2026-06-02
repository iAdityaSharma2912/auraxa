import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel

from app.core.security import get_current_user
from app.models.user import User, SubscriptionTier
from app.services.palm_service import analyze_palm

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB


def _check_palm_access(user: User) -> None:
    if user.subscription_tier.value not in ("premium", "pro"):
        raise HTTPException(
            status_code=402,
            detail="Palm Analysis is a Pro feature. Please upgrade your plan."
        )


@router.post("/analyse")
async def analyse_palm(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    _check_palm_access(current_user)

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP images are supported.")

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5MB.")

    image_b64 = base64.b64encode(content).decode("utf-8")

    try:
        result = await analyze_palm(image_b64, file.content_type or "image/jpeg")
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Palm error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Palm analysis encountered an error: {str(e)[:200]}"
        )