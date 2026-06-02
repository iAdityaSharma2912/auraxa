import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Text, Float, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


# ─── Enums ────────────────────────────────────────────────────
class SubscriptionTier(str, enum.Enum):
    free = "free"
    premium = "premium"
    pro = "pro"


class AnalysisStatus(str, enum.Enum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class InputType(str, enum.Enum):
    screenshot = "screenshot"
    text_export = "text_export"
    json_export = "json_export"
    paste = "paste"


class AnalysisIntent(str, enum.Enum):
    conversation = "conversation"
    pattern = "pattern"
    style = "style"


class ToxicityLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class AttachmentStyle(str, enum.Enum):
    secure = "secure"
    anxious = "anxious"
    avoidant = "avoidant"
    disorganized = "disorganized"


class GhostingRisk(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


# ─── User ─────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[Optional[str]] = mapped_column(String(255))
    avatar_url: Mapped[Optional[str]] = mapped_column(Text)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255))
    google_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True)

    subscription_tier: Mapped[SubscriptionTier] = mapped_column(
        SAEnum(SubscriptionTier), default=SubscriptionTier.free
    )
    subscription_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    analyses_used_month: Mapped[int] = mapped_column(Integer, default=0)
    advisor_msgs_used_month: Mapped[int] = mapped_column(Integer, default=0)

    # Promo codes this user has redeemed
    promo_codes_used: Mapped[Optional[list]] = mapped_column(JSONB, default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    analyses: Mapped[list["Analysis"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    conversations: Mapped[list["AdvisorConversation"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    reports: Mapped[list["Report"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    subscriptions: Mapped[list["Subscription"]] = relationship(back_populates="user", cascade="all, delete-orphan")


# ─── Analysis ─────────────────────────────────────────────────
class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)

    status: Mapped[AnalysisStatus] = mapped_column(SAEnum(AnalysisStatus), default=AnalysisStatus.queued)
    input_type: Mapped[InputType] = mapped_column(SAEnum(InputType), default=InputType.screenshot)
    intent: Mapped[AnalysisIntent] = mapped_column(SAEnum(AnalysisIntent), default=AnalysisIntent.conversation)

    speakers: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    raw_messages: Mapped[Optional[list]] = mapped_column(JSONB, default=list)
    message_count: Mapped[int] = mapped_column(Integer, default=0)
    date_range: Mapped[Optional[dict]] = mapped_column(JSONB)
    file_paths: Mapped[Optional[list]] = mapped_column(JSONB, default=list)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    celery_task_id: Mapped[Optional[str]] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped["User"] = relationship(back_populates="analyses")
    scores: Mapped[Optional["EmotionalScore"]] = relationship(back_populates="analysis", uselist=False, cascade="all, delete-orphan")
    timeline: Mapped[list["TimelinePoint"]] = relationship(back_populates="analysis", cascade="all, delete-orphan")
    report: Mapped[Optional["Report"]] = relationship(back_populates="analysis", uselist=False, cascade="all, delete-orphan")
    conversations: Mapped[list["AdvisorConversation"]] = relationship(back_populates="analysis", cascade="all, delete-orphan")


# ─── Emotional Scores ─────────────────────────────────────────
class EmotionalScore(Base):
    __tablename__ = "emotional_scores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[str] = mapped_column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"), unique=True)

    overall_score: Mapped[int] = mapped_column(Integer, default=0)
    compatibility_score: Mapped[int] = mapped_column(Integer, default=0)
    communication_balance: Mapped[int] = mapped_column(Integer, default=50)
    speaker_a_percentage: Mapped[int] = mapped_column(Integer, default=50)
    speaker_b_percentage: Mapped[int] = mapped_column(Integer, default=50)

    toxicity_level: Mapped[ToxicityLevel] = mapped_column(SAEnum(ToxicityLevel), default=ToxicityLevel.low)
    attachment_style: Mapped[AttachmentStyle] = mapped_column(SAEnum(AttachmentStyle), default=AttachmentStyle.secure)
    ghosting_risk: Mapped[GhostingRisk] = mapped_column(SAEnum(GhostingRisk), default=GhostingRisk.low)

    patterns_detected: Mapped[list] = mapped_column(JSONB, default=list)
    ai_narrative: Mapped[Optional[str]] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    analysis: Mapped["Analysis"] = relationship(back_populates="scores")


# ─── Timeline Points ──────────────────────────────────────────
class TimelinePoint(Base):
    __tablename__ = "timeline_points"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[str] = mapped_column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"), index=True)

    timestamp: Mapped[str] = mapped_column(String(100))
    emotional_intensity: Mapped[float] = mapped_column(Float, default=50.0)
    sentiment: Mapped[str] = mapped_column(String(20), default="neutral")
    speaker: Mapped[str] = mapped_column(String(1), default="a")
    sequence_index: Mapped[int] = mapped_column(Integer, default=0)

    analysis: Mapped["Analysis"] = relationship(back_populates="timeline")


# ─── Advisor Conversation ─────────────────────────────────────
class AdvisorConversation(Base):
    __tablename__ = "advisor_conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    analysis_id: Mapped[str] = mapped_column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"), index=True)

    messages: Mapped[list] = mapped_column(JSONB, default=list)
    message_count: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped["User"] = relationship(back_populates="conversations")
    analysis: Mapped["Analysis"] = relationship(back_populates="conversations")


# ─── Report ───────────────────────────────────────────────────
class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[str] = mapped_column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"), unique=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)

    share_token: Mapped[str] = mapped_column(String(64), unique=True, default=lambda: str(uuid.uuid4()).replace("-", ""))
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    card_url: Mapped[Optional[str]] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    analysis: Mapped["Analysis"] = relationship(back_populates="report")
    user: Mapped["User"] = relationship(back_populates="reports")


# ─── Subscription ─────────────────────────────────────────────
class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)

    plan: Mapped[SubscriptionTier] = mapped_column(SAEnum(SubscriptionTier))
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(255))
    razorpay_subscription_id: Mapped[Optional[str]] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(20), default="active")

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship(back_populates="subscriptions")
