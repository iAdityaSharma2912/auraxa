from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ─── Enums (mirror models) ────────────────────────────────────
class SubscriptionTierSchema(str, Enum):
    free = "free"
    premium = "premium"
    pro = "pro"


class AnalysisStatusSchema(str, Enum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class ToxicityLevelSchema(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class AttachmentStyleSchema(str, Enum):
    secure = "secure"
    anxious = "anxious"
    avoidant = "avoidant"
    disorganized = "disorganized"


class GhostingRiskSchema(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class AnalysisIntentSchema(str, Enum):
    conversation = "conversation"
    pattern = "pattern"
    style = "style"


# ─── Auth ─────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class GoogleAuthRequest(BaseModel):
    id_token: str


# ─── User ─────────────────────────────────────────────────────
class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    avatar_url: Optional[str]
    subscription_tier: SubscriptionTierSchema
    subscription_expires_at: Optional[datetime]
    analyses_used_month: int
    advisor_msgs_used_month: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Analysis ─────────────────────────────────────────────────
class UploadResponse(BaseModel):
    analysis_id: str
    status: str = "queued"


class AnalysisStatusResponse(BaseModel):
    id: str
    status: AnalysisStatusSchema
    step: Optional[str] = None
    progress: Optional[int] = None
    error: Optional[str] = None


class EmotionalScoreResponse(BaseModel):
    overall_score: int
    compatibility_score: int
    communication_balance: int
    speaker_a_percentage: int
    speaker_b_percentage: int
    toxicity_level: ToxicityLevelSchema
    attachment_style: AttachmentStyleSchema
    ghosting_risk: GhostingRiskSchema
    patterns_detected: List[str]
    ai_narrative: Optional[str]

    class Config:
        from_attributes = True


class TimelinePointResponse(BaseModel):
    timestamp: str
    emotional_intensity: float
    sentiment: str
    speaker: str

    class Config:
        from_attributes = True


class AnalysisResponse(BaseModel):
    id: str
    status: AnalysisStatusSchema
    input_type: str
    intent: str
    speakers: Optional[dict]
    message_count: int
    date_range: Optional[dict]
    scores: Optional[EmotionalScoreResponse]
    timeline: List[TimelinePointResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Advisor ──────────────────────────────────────────────────
class AdvisorMessageRequest(BaseModel):
    analysis_id: str
    message: str
    session_id: Optional[str] = None


class AdvisorMessageResponse(BaseModel):
    response: str
    session_id: str


class AdvisorHistoryResponse(BaseModel):
    session_id: str
    messages: List[dict]


# ─── Reports ──────────────────────────────────────────────────
class ReportResponse(BaseModel):
    id: str
    analysis_id: str
    share_token: str
    is_public: bool
    view_count: int
    card_url: Optional[str]
    created_at: datetime
    analysis: Optional[AnalysisResponse]

    class Config:
        from_attributes = True


class ShareReportResponse(BaseModel):
    share_url: str
    card_url: Optional[str]


# ─── Subscriptions ────────────────────────────────────────────
class CreateSubscriptionRequest(BaseModel):
    plan: SubscriptionTierSchema
    payment_provider: str = "razorpay"  # "razorpay" | "stripe"


class SubscriptionResponse(BaseModel):
    id: str
    plan: SubscriptionTierSchema
    status: str
    started_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True
