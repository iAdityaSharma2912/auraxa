from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # ─── App ────────────────────────────────────────
    APP_NAME: str = "Auraxa API"
    DEBUG: bool = False
    SECRET_KEY: str = "change-this-in-production"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://auraxa.app"]

    # ─── Database ───────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/auraxa"

    # ─── Redis / Celery ─────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # ─── JWT ────────────────────────────────────────
    JWT_SECRET: str = "change-this-jwt-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_EXPIRE_DAYS: int = 30

    # ─── AI Provider Keys ───────────────────────────
    # Provider 1: OpenRouter (routes to GPT-4o-mini / GPT-4o)
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # Provider 2: Google Gemini (OpenAI-compatible endpoint)
    GEMINI_API_KEY: str = ""
    GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"

    # Provider 3: NVIDIA NIM (OpenAI-compatible endpoint)
    NVIDIA_API_KEY: str = ""
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"

    # ─── Provider Priority ──────────────────────────
    # Comma-separated — first available key wins
    # Change order to prioritise a different provider
    AI_PROVIDER_PRIORITY: str = "openrouter,gemini,nvidia"

    # ─── Model mapping per provider ─────────────────
    # Analysis model (faster, cheaper)
    OPENROUTER_ANALYSIS_MODEL: str = "openai/gpt-4o-mini"
    GEMINI_ANALYSIS_MODEL: str = "gemini-2.0-flash"
    NVIDIA_ANALYSIS_MODEL: str = "meta/llama-3.1-70b-instruct"

    # Advisor model (smarter, more nuanced)
    OPENROUTER_ADVISOR_MODEL: str = "openai/gpt-4o"
    GEMINI_ADVISOR_MODEL: str = "gemini-1.5-pro"
    NVIDIA_ADVISOR_MODEL: str = "meta/llama-3.1-70b-instruct"

    # Vision model (for palm analysis)
    OPENROUTER_VISION_MODEL: str = "openai/gpt-4o"
    GEMINI_VISION_MODEL: str = "gemini-2.0-flash"
    NVIDIA_VISION_MODEL: str = "microsoft/phi-3-vision-128k-instruct"

    # ─── Supabase ───────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # ─── Payments ───────────────────────────────────
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # ─── Tier limits ────────────────────────────────
    FREE_ANALYSES_PER_MONTH: int = 3
    PREMIUM_ANALYSES_PER_MONTH: int = 20
    PREMIUM_ADVISOR_MSGS_PER_MONTH: int = 50

    # ─── Promo / Secret Codes ───────────────────────
    PROMO_CODES: str = "AURAXA_DEV,FOUNDER2024"

    # ─── Admin ──────────────────────────────────────
    ADMIN_EMAILS: str = "imaddy2912@gmail.com"
    # ─── Resend Email Service ───────────────────────
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "onboarding@resend.dev"
    FRONTEND_URL: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

    def get_provider_priority(self) -> List[str]:
        return [p.strip().lower() for p in self.AI_PROVIDER_PRIORITY.split(",") if p.strip()]

    def get_promo_codes(self) -> List[str]:
        return [c.strip().upper() for c in self.PROMO_CODES.split(",") if c.strip()]

    def get_admin_emails(self) -> List[str]:
        return [e.strip().lower() for e in self.ADMIN_EMAILS.split(",") if e.strip()]

    def is_valid_promo(self, code: str) -> bool:
        return code.strip().upper() in self.get_promo_codes()

    def is_admin(self, email: str) -> bool:
        return email.strip().lower() in self.get_admin_emails()


settings = Settings()
