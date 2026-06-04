"""Razorpay payment integration — order creation, webhook, subscription management."""
import hashlib
import hmac
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# ── Plan config ──────────────────────────────────────────
PLANS = {
    "premium": {"name": "Auraxa Premium", "amount": 29900, "currency": "INR"},  # ₹299
    "pro":     {"name": "Auraxa Pro",     "amount": 59900, "currency": "INR"},  # ₹599
}


def get_razorpay_client():
    import razorpay
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(503, "Payment service not configured.")
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


def get_redis():
    import redis as r
    return r.from_url(settings.REDIS_URL, decode_responses=True)


class CreateOrderRequest(BaseModel):
    plan: str


@router.post("/create-order")
async def create_order(
    body: CreateOrderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a Razorpay order for a subscription plan."""
    if body.plan not in PLANS:
        raise HTTPException(400, f"Invalid plan. Choose: {list(PLANS.keys())}")

    plan = PLANS[body.plan]
    client = get_razorpay_client()

    try:
        order = client.order.create({
            "amount":   plan["amount"],
            "currency": plan["currency"],
            "receipt":  f"auraxa_{current_user.id}_{body.plan}",
            "notes": {
                "user_id":    str(current_user.id),
                "user_email": current_user.email or "",
                "plan":       body.plan,
            },
        })
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {e}")
        raise HTTPException(500, "Could not create payment order. Please try again.")

    # Store order metadata in Redis (24h TTL) for webhook lookup
    try:
        rc = get_redis()
        rc.setex(
            f"auraxa:order:{order['id']}",
            86400,
            json.dumps({
                "user_id": str(current_user.id),
                "plan":    body.plan,
                "amount":  plan["amount"],
            }),
        )
    except Exception as e:
        logger.warning(f"Redis order store failed: {e}")

    return {
        "order_id":   order["id"],
        "amount":     plan["amount"],
        "currency":   plan["currency"],
        "plan_name":  plan["name"],
        "key_id":     settings.RAZORPAY_KEY_ID,
        "prefill": {
            "name":  current_user.name or "",
            "email": current_user.email or "",
        },
    }


@router.post("/verify")
async def verify_payment(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Verify payment signature after Razorpay checkout completes (client-side callback)."""
    body = await request.json()
    order_id   = body.get("razorpay_order_id")
    payment_id = body.get("razorpay_payment_id")
    signature  = body.get("razorpay_signature")

    if not all([order_id, payment_id, signature]):
        raise HTTPException(400, "Missing payment fields.")

    # Verify HMAC signature
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        f"{order_id}|{payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        raise HTTPException(400, "Payment verification failed — invalid signature.")

    # Get plan from Redis
    plan = "premium"
    try:
        rc = get_redis()
        raw = rc.get(f"auraxa:order:{order_id}")
        if raw:
            data = json.loads(raw)
            plan = data.get("plan", "premium")
            rc.delete(f"auraxa:order:{order_id}")
    except Exception as e:
        logger.warning(f"Redis order lookup failed: {e}")

    # Upgrade user
    result = await db.execute(select(User).where(User.id == current_user.id))
    user   = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found.")

    user.subscription_tier = plan
    await db.commit()

    logger.info(f"Payment verified: user={current_user.email} plan={plan} payment={payment_id}")
    return {"success": True, "plan": plan, "message": f"Upgraded to {plan.title()}!"}


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Razorpay webhook — handles payment.captured events server-side."""
    body_bytes = await request.body()

    # Verify webhook signature
    if x_razorpay_signature and settings.RAZORPAY_WEBHOOK_SECRET:
        expected = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode(),
            body_bytes,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, x_razorpay_signature):
            logger.warning("Webhook signature mismatch")
            raise HTTPException(400, "Invalid webhook signature.")

    try:
        payload = json.loads(body_bytes)
    except Exception:
        raise HTTPException(400, "Invalid JSON payload.")

    event = payload.get("event")
    logger.info(f"Razorpay webhook: {event}")

    if event != "payment.captured":
        return {"status": "ignored"}

    payment = payload.get("payload", {}).get("payment", {}).get("entity", {})
    order_id = payment.get("order_id")
    if not order_id:
        return {"status": "no order_id"}

    # Look up order in Redis
    try:
        rc = get_redis()
        raw = rc.get(f"auraxa:order:{order_id}")
        if not raw:
            logger.warning(f"Webhook: order {order_id} not found in Redis")
            return {"status": "order not found"}

        data    = json.loads(raw)
        user_id = data.get("user_id")
        plan    = data.get("plan", "premium")
        rc.delete(f"auraxa:order:{order_id}")
    except Exception as e:
        logger.error(f"Webhook Redis lookup failed: {e}")
        return {"status": "redis error"}

    # Upgrade user tier
    try:
        result = await db.execute(select(User).where(User.id == user_id))
        user   = result.scalar_one_or_none()
        if user:
            user.subscription_tier = plan
            await db.commit()
            logger.info(f"Webhook: upgraded user {user_id} to {plan}")
    except Exception as e:
        logger.error(f"Webhook DB upgrade failed: {e}")

    return {"status": "ok"}


@router.get("/status")
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
):
    """Get current user subscription status."""
    tier = current_user.subscription_tier or "free"
    limits = {"free": 3, "premium": 20, "pro": 9999}
    return {
        "tier":            tier,
        "analyses_limit":  limits.get(tier, 3),
        "is_premium":      tier in ("premium", "pro"),
        "is_pro":          tier == "pro",
    }
