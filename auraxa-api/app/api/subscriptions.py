from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User, Subscription, SubscriptionTier
from app.schemas.schemas import CreateSubscriptionRequest, SubscriptionResponse

router = APIRouter()

PLAN_PRICES = {
    "premium": {"inr": 29900, "usd_cents": 499},  # paise / cents
    "pro": {"inr": 69900, "usd_cents": 999},
}


@router.get("/plans")
async def get_plans():
    return [
        {
            "id": "free",
            "name": "Free",
            "price_inr": 0,
            "price_usd": 0,
            "analyses_per_month": settings.FREE_ANALYSES_PER_MONTH,
            "advisor_messages_per_month": 0,
            "features": ["3 analyses/month", "Basic scores", "Watermarked cards"],
        },
        {
            "id": "premium",
            "name": "Premium",
            "price_inr": 299,
            "price_usd": 4.99,
            "analyses_per_month": settings.PREMIUM_ANALYSES_PER_MONTH,
            "advisor_messages_per_month": settings.PREMIUM_ADVISOR_MSGS_PER_MONTH,
            "features": ["20 analyses/month", "AI Advisor", "Timeline charts", "No watermark"],
        },
        {
            "id": "pro",
            "name": "Pro",
            "price_inr": 699,
            "price_usd": 9.99,
            "analyses_per_month": 999,
            "advisor_messages_per_month": 999,
            "features": ["Unlimited analyses", "Unlimited Advisor", "Palm Analysis", "PDF Export", "API Access"],
        },
    ]


@router.post("/create")
async def create_subscription(
    body: CreateSubscriptionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.plan.value == "free":
        raise HTTPException(status_code=400, detail="Cannot create subscription for free plan.")

    prices = PLAN_PRICES.get(body.plan.value)
    if not prices:
        raise HTTPException(status_code=400, detail="Invalid plan.")

    if body.payment_provider == "razorpay":
        if not settings.RAZORPAY_KEY_ID:
            raise HTTPException(status_code=503, detail="Razorpay not configured.")
        try:
            import razorpay
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            order = client.order.create({
                "amount": prices["inr"],
                "currency": "INR",
                "notes": {"user_id": current_user.id, "plan": body.plan.value},
            })
            return {
                "provider": "razorpay",
                "order_id": order["id"],
                "amount": prices["inr"],
                "currency": "INR",
                "key_id": settings.RAZORPAY_KEY_ID,
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Razorpay error: {str(e)}")

    elif body.payment_provider == "stripe":
        if not settings.STRIPE_SECRET_KEY:
            raise HTTPException(status_code=503, detail="Stripe not configured.")
        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                mode="subscription",
                customer_email=current_user.email,
                metadata={"user_id": current_user.id, "plan": body.plan.value},
                success_url="https://auraxa.app/dashboard?upgraded=1",
                cancel_url="https://auraxa.app/settings",
                line_items=[{
                    "price_data": {
                        "currency": "usd",
                        "unit_amount": prices["usd_cents"],
                        "recurring": {"interval": "month"},
                        "product_data": {"name": f"Auraxa {body.plan.value.capitalize()}"},
                    },
                    "quantity": 1,
                }],
            )
            return {"provider": "stripe", "checkout_url": session.url}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")

    raise HTTPException(status_code=400, detail="Invalid payment provider.")


@router.post("/webhook")
async def subscription_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Handle payment webhooks from Razorpay and Stripe.
    Upgrades user tier on successful payment.
    """
    body = await request.json()
    provider = request.headers.get("X-Payment-Provider", "razorpay")

    if provider == "stripe":
        sig = request.headers.get("stripe-signature", "")
        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            raw = await request.body()
            event = stripe.Webhook.construct_event(raw, sig, settings.STRIPE_WEBHOOK_SECRET)

            if event["type"] == "checkout.session.completed":
                session = event["data"]["object"]
                user_id = session["metadata"]["user_id"]
                plan = session["metadata"]["plan"]
                await _upgrade_user(db, user_id, plan, stripe_sub_id=session.get("subscription"))

        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    return {"received": True}


async def _upgrade_user(db: AsyncSession, user_id: str, plan: str, stripe_sub_id: str = None, razorpay_sub_id: str = None):
    from sqlalchemy import select
    from datetime import datetime, timedelta, timezone

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return

    user.subscription_tier = SubscriptionTier(plan)
    user.subscription_expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    user.analyses_used_month = 0
    user.advisor_msgs_used_month = 0

    sub = Subscription(
        user_id=user_id,
        plan=SubscriptionTier(plan),
        stripe_subscription_id=stripe_sub_id,
        razorpay_subscription_id=razorpay_sub_id,
        status="active",
        expires_at=user.subscription_expires_at,
    )
    db.add(sub)
    await db.commit()


import hmac, hashlib, json as _json
from app.core.config import settings

@router.post("/create-order")
async def create_order_razorpay(
    body: CreateSubscriptionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create Razorpay order — called by upgrade page."""
    if body.plan.value == "free":
        raise HTTPException(400, "Cannot create order for free plan.")
    prices = PLAN_PRICES.get(body.plan.value)
    if not prices:
        raise HTTPException(400, "Invalid plan.")
    if not settings.RAZORPAY_KEY_ID:
        raise HTTPException(503, "Razorpay not configured.")
    try:
        import razorpay
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        order  = client.order.create({
            "amount": prices["inr"], "currency": "INR",
            "receipt": f"auraxa_{current_user.id}_{body.plan.value}",
            "notes": {"user_id": str(current_user.id), "plan": body.plan.value},
        })
        # Cache in Redis for webhook lookup
        try:
            import redis as r
            rc = r.from_url(settings.REDIS_URL, decode_responses=True)
            rc.setex(f"auraxa:order:{order['id']}", 86400,
                _json.dumps({"user_id": str(current_user.id), "plan": body.plan.value}))
        except Exception:
            pass
        return {
            "order_id": order["id"], "amount": prices["inr"],
            "currency": "INR", "plan_name": f"Auraxa {body.plan.value.capitalize()}",
            "key_id": settings.RAZORPAY_KEY_ID,
            "prefill": {"name": current_user.name or "", "email": current_user.email or ""},
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Razorpay error: {e}")


@router.post("/verify")
async def verify_razorpay_payment(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Verify Razorpay payment signature after checkout."""
    body       = await request.json()
    order_id   = body.get("razorpay_order_id")
    payment_id = body.get("razorpay_payment_id")
    signature  = body.get("razorpay_signature")
    if not all([order_id, payment_id, signature]):
        raise HTTPException(400, "Missing payment fields.")

    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        f"{order_id}|{payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(400, "Invalid payment signature.")

    plan = "premium"
    try:
        import redis as r
        rc = r.from_url(settings.REDIS_URL, decode_responses=True)
        raw = rc.get(f"auraxa:order:{order_id}")
        if raw:
            plan = _json.loads(raw).get("plan", "premium")
            rc.delete(f"auraxa:order:{order_id}")
    except Exception:
        pass

    await _upgrade_user(db, str(current_user.id), plan)
    return {"success": True, "plan": plan, "message": f"Upgraded to {plan.title()}!"}


@router.get("/status")
async def subscription_status(current_user: User = Depends(get_current_user)):
    """Current user subscription tier + limits."""
    tier   = current_user.subscription_tier
    tier_v = tier.value if hasattr(tier, "value") else str(tier or "free")
    limits = {"free": 3, "premium": 20, "pro": 9999}
    return {
        "tier": tier_v,
        "analyses_limit": limits.get(tier_v, 3),
        "is_premium": tier_v in ("premium", "pro"),
        "is_pro": tier_v == "pro",
    }