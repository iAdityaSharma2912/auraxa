from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
import secrets
import hashlib
import json
import logging

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)
from app.core.config import settings
from app.models.user import User
from app.schemas.schemas import (
    RegisterRequest, LoginRequest, TokenResponse, GoogleAuthRequest,
)

router = APIRouter()
logger = logging.getLogger(__name__)

RESET_TOKEN_EXPIRY_SECONDS = 30 * 60  # 30 minutes


# ── Redis token storage ───────────────────────────────────

def _get_redis():
    import redis as redis_lib
    return redis_lib.from_url(settings.REDIS_URL, decode_responses=True)


def _token_key(token_hash: str) -> str:
    return f"auraxa:password_reset:{token_hash}"


def _generate_reset_token(email: str) -> str:
    token      = secrets.token_urlsafe(40)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    try:
        r = _get_redis()
        r.setex(
            _token_key(token_hash),
            RESET_TOKEN_EXPIRY_SECONDS,
            json.dumps({"email": email}),
        )
    except Exception as e:
        logger.error(f"Redis error storing reset token: {e}")
        raise
    return token


def _verify_reset_token(token: str) -> str | None:
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    try:
        r    = _get_redis()
        data = r.get(_token_key(token_hash))
        if not data:
            return None
        return json.loads(data).get("email")
    except Exception as e:
        logger.error(f"Redis error verifying reset token: {e}")
        return None


def _consume_reset_token(token: str) -> None:
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    try:
        _get_redis().delete(_token_key(token_hash))
    except Exception as e:
        logger.error(f"Redis error consuming reset token: {e}")


# ── Email template ────────────────────────────────────────

def _build_reset_html(email: str, reset_url: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#07070c;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07070c;padding:40px 20px;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0"
             style="background:#0f0f22;border-radius:16px;border:1px solid rgba(124,58,237,0.2);max-width:500px;width:100%;">

        <tr>
          <td style="padding:28px 36px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.2em;color:#c4b5fd;">AURAXA</p>
            <p style="margin:3px 0 0;font-size:10px;letter-spacing:0.4em;color:rgba(196,181,253,0.3);">FEEL THE UNSAID</p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 36px;">
            <h1 style="margin:0 0 10px;font-size:20px;font-weight:600;color:rgba(255,255,255,0.9);">
              Reset your password
            </h1>
            <p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">
              We received a request to reset the password for
              <span style="color:rgba(196,181,253,0.8);">{email}</span>.
              This link expires in <strong style="color:rgba(255,255,255,0.65);">30 minutes</strong>.
            </p>

            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:10px;">
                  <a href="{reset_url}"
                     style="display:inline-block;padding:13px 28px;color:#fff;
                            font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;">
                    Reset Password →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.22);">
              Or paste this link in your browser:
            </p>
            <p style="margin:0 0 24px;font-size:11px;color:rgba(196,181,253,0.4);word-break:break-all;
                       font-family:monospace;background:rgba(255,255,255,0.03);
                       border-radius:8px;padding:10px 12px;border:1px solid rgba(255,255,255,0.06);">
              {reset_url}
            </p>

            <div style="background:rgba(255,255,255,0.02);border-radius:8px;
                         border:1px solid rgba(255,255,255,0.06);padding:14px;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.28);line-height:1.5;">
                If you didn't request this, you can safely ignore this email.
                Your password won't change.
              </p>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 36px;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.15);
                       letter-spacing:0.08em;text-align:center;">
              © 2026 AURAXA · FEEL THE UNSAID
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


# ── Resend email sender ───────────────────────────────────

async def _send_reset_email(email: str, token: str) -> bool:
    frontend  = settings.FRONTEND_URL.rstrip("/")
    reset_url = f"{frontend}/reset-password?token={token}"

    # Dev fallback — no API key set
    if not settings.RESEND_API_KEY:
        logger.info(f"[PASSWORD RESET — no key] {email} → {reset_url}")
        return True

    html = _build_reset_html(email, reset_url)

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type":  "application/json",
                },
                json={
                    "from":    settings.EMAIL_FROM,
                    "to":      email,
                    "subject": "Reset your Auraxa password",
                    "html":    html,
                },
            )

        if resp.status_code in (200, 201):
            logger.info(f"Reset email sent to {email} — id: {resp.json().get('id')}")
            return True

        logger.error(f"Resend error {resp.status_code}: {resp.text}")
        return False

    except Exception as e:
        logger.error(f"Failed to send reset email: {e}")
        return False


# ── Endpoints ─────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered.")
    user = User(
        email=body.email,
        name=body.name,
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user   = result.scalar_one_or_none()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/forgot-password")
async def forgot_password(body: dict, db: AsyncSession = Depends(get_db)):
    email = (body.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email required.")

    result = await db.execute(select(User).where(User.email == email))
    user   = result.scalar_one_or_none()

    if user and user.hashed_password:
        try:
            token = _generate_reset_token(email)
            sent  = await _send_reset_email(email, token)
            if not sent:
                logger.error(f"Email delivery failed for {email}")
        except Exception as e:
            logger.error(f"Forgot password error: {e}")

    return {"success": True, "message": "If that account exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(body: dict, db: AsyncSession = Depends(get_db)):
    token    = (body.get("token") or "").strip()
    password = (body.get("password") or "").strip()

    if not token:
        raise HTTPException(status_code=400, detail="Reset token required.")
    if not password or len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    email = _verify_reset_token(token)
    if not email:
        raise HTTPException(
            status_code=400,
            detail="This reset link is invalid or has expired. Please request a new one.",
        )

    result = await db.execute(select(User).where(User.email == email))
    user   = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")

    user.hashed_password = hash_password(password)
    await db.commit()
    _consume_reset_token(token)

    logger.info(f"Password reset successful for {email}")
    return {"success": True, "message": "Password updated. You can now sign in."}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: dict, db: AsyncSession = Depends(get_db)):
    token = body.get("refresh_token")
    if not token:
        raise HTTPException(status_code=400, detail="refresh_token required.")
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type.")
    result = await db.execute(select(User).where(User.id == payload.get("sub")))
    user   = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/google", response_model=TokenResponse)
async def google_auth(body: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={body.id_token}"
            )
            resp.raise_for_status()
            info = resp.json()
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token.")

    email     = info.get("email")
    google_id = info.get("sub")
    name      = info.get("name")
    picture   = info.get("picture")

    if not email or not google_id:
        raise HTTPException(status_code=400, detail="Missing email/sub in Google token.")

    result = await db.execute(select(User).where(User.google_id == google_id))
    user   = result.scalar_one_or_none()
    if not user:
        result = await db.execute(select(User).where(User.email == email))
        user   = result.scalar_one_or_none()

    if user:
        user.google_id = google_id
        if picture and not user.avatar_url:
            user.avatar_url = picture
    else:
        user = User(email=email, name=name, avatar_url=picture, google_id=google_id)
        db.add(user)

    await db.commit()
    await db.refresh(user)
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/google-mobile", response_model=TokenResponse)
async def google_auth_mobile(body: dict, db: AsyncSession = Depends(get_db)):
    access_token = body.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="access_token required.")

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/userinfo/v2/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            resp.raise_for_status()
            info = resp.json()
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google access token.")

    email     = info.get("email")
    google_id = info.get("id")
    name      = info.get("name")
    picture   = info.get("picture")

    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google.")

    user = None
    if google_id:
        result = await db.execute(select(User).where(User.google_id == google_id))
        user   = result.scalar_one_or_none()
    if not user:
        result = await db.execute(select(User).where(User.email == email))
        user   = result.scalar_one_or_none()

    if user:
        if google_id:
            user.google_id = google_id
        if picture and not user.avatar_url:
            user.avatar_url = picture
    else:
        user = User(email=email, name=name, avatar_url=picture, google_id=google_id)
        db.add(user)

    await db.commit()
    await db.refresh(user)
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )