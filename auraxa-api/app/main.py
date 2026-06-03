from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import create_db_tables

from app.api import (
    auth,
    analyze,
    advisor,
    reports,
    users,
    subscriptions,
    ws,
    demo,
    promo,
    astrology,
    palm,
    admin,
    daily_insight,
    cards,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Auraxa API v0.4.0...")
    await create_db_tables()
    logger.info("Database tables ready.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="Auraxa API",
    version="0.4.0",
    description="AI Emotional Intelligence Platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )


# ─── HTTP Routers ─────────────────────────────────────────────
app.include_router(auth.router,          prefix="/api/auth",          tags=["Auth"])
app.include_router(analyze.router,       prefix="/api/analyze",       tags=["Analysis"])
app.include_router(advisor.router,       prefix="/api/advisor",       tags=["Advisor"])
app.include_router(reports.router,       prefix="/api/reports",       tags=["Reports"])
app.include_router(users.router,         prefix="/api/users",         tags=["Users"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["Subscriptions"])
app.include_router(promo.router,         prefix="/api/promo",         tags=["Promo"])
app.include_router(astrology.router,     prefix="/api/astrology",     tags=["Astrology"])
app.include_router(palm.router,          prefix="/api/palm",          tags=["Palm"])
app.include_router(admin.router,         prefix="/api/admin",         tags=["Admin"])
app.include_router(cards.router,         prefix="/api/cards",         tags=["Cards"])
app.include_router(daily_insight.router, prefix="/api",              tags=["Daily Insight"])
app.include_router(demo.router,                                      tags=["Demo"])

# ─── WebSocket ────────────────────────────────────────────────
app.include_router(ws.router, tags=["WebSocket"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.4.0"}
