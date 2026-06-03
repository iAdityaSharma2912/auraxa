"""
Celery Analysis Tasks — Fixed
------------------------------
- Uses NullPool to prevent asyncio event loop conflicts
- Handles raw_text_only mode (screenshot OCR fallback)
- Updates speakers from AI-identified names when in raw text mode
- Stores real token counts from OpenRouter API response
"""

import asyncio
import logging
import os
from celery import Celery
from sqlalchemy.pool import NullPool
from app.core.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "auraxa",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)


def run_async(coro):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        try:
            pending = asyncio.all_tasks(loop)
            if pending:
                for task in pending:
                    task.cancel()
                loop.run_until_complete(
                    asyncio.gather(*pending, return_exceptions=True)
                )
        except Exception:
            pass
        finally:
            loop.close()
            asyncio.set_event_loop(None)


@celery_app.task(
    bind=True,
    name="tasks.run_analysis",
    max_retries=2,
    default_retry_delay=30,
    soft_time_limit=300,
    time_limit=360,
)
def run_analysis_task(
    self, analysis_id: str, file_paths: list, input_type: str, intent: str
):
    logger.info(f"[{analysis_id}] Task started — input_type={input_type} intent={intent}")
    return run_async(_run_pipeline(analysis_id, file_paths, input_type, intent))


async def _run_pipeline(
    analysis_id: str, file_paths: list, input_type: str, intent: str
):
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
    from sqlalchemy import select
    from app.models.user import Analysis, AnalysisStatus, EmotionalScore, TimelinePoint, Report
    from app.services.ocr_service import structure_conversation
    from app.services.ai_service import run_emotional_analysis
    from app.services.ai_router import ai_router

    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
    SessionLocal = async_sessionmaker(
        engine, class_=AsyncSession,
        expire_on_commit=False, autocommit=False, autoflush=False,
    )

    try:
        async with SessionLocal() as db:
            result = await db.execute(select(Analysis).where(Analysis.id == analysis_id))
            analysis = result.scalar_one_or_none()
            if not analysis:
                logger.error(f"[{analysis_id}] Analysis record not found")
                return

            try:
                # ── Stage 1: Mark processing ──────────────────────
                analysis.status = AnalysisStatus.processing
                await db.commit()
                logger.info(f"[{analysis_id}] Stage 1: Processing started")

                # ── Stage 2: OCR / structure ──────────────────────
                logger.info(f"[{analysis_id}] Stage 2: Structuring from {len(file_paths)} file(s)")
                conv_data = structure_conversation(file_paths, input_type)
                raw_text_only = conv_data.get("raw_text_only", False)

                if raw_text_only:
                    logger.info(
                        f"[{analysis_id}] Raw text mode active "
                        f"({len(conv_data.get('raw_text', ''))} chars) — AI will extract structure"
                    )
                    analysis.speakers      = conv_data["speakers"]
                    analysis.raw_messages  = []
                    analysis.message_count = conv_data["message_count"]
                    analysis.date_range    = conv_data["date_range"]
                else:
                    if conv_data["message_count"] == 0:
                        raise ValueError(
                            "No text could be extracted from the uploaded file. "
                            "Please use the Paste Text option instead."
                        )
                    analysis.speakers      = conv_data["speakers"]
                    analysis.raw_messages  = conv_data["messages"][:200]
                    analysis.message_count = conv_data["message_count"]
                    analysis.date_range    = conv_data["date_range"]

                await db.commit()
                logger.info(
                    f"[{analysis_id}] Stage 2 complete: "
                    f"{conv_data['message_count']} messages, "
                    f"raw_text_only={raw_text_only}"
                )

                # ── Stage 3: AI analysis ──────────────────────────
                logger.info(f"[{analysis_id}] Stage 3: Running AI analysis")
                ai_result, ai_usage = await run_emotional_analysis(conv_data, intent)

                # If AI identified speakers from screenshot, update the record
                if raw_text_only and conv_data.get("speakers") != {"a": "Person A", "b": "Person B"}:
                    analysis.speakers = conv_data["speakers"]

                overall_score       = int(ai_result.get("overall_score", 50))
                compatibility_score = int(ai_result.get("compatibility_score", 50))
                toxicity_level      = ai_result.get("toxicity_level", "low")
                ghosting_risk       = ai_result.get("ghosting_risk", "low")
                patterns_detected   = ai_result.get("patterns_detected", [])

                logger.info(
                    f"[{analysis_id}] Stage 3 complete: score={overall_score} "
                    f"| tokens={ai_usage.get('total_tokens', 0)}"
                )

                # ── Stage 4: Save scores ──────────────────────────
                score = EmotionalScore(
                    analysis_id=analysis_id,
                    overall_score=overall_score,
                    compatibility_score=compatibility_score,
                    communication_balance=int(ai_result.get("communication_balance", 50)),
                    speaker_a_percentage=conv_data["speaker_a_pct"],
                    speaker_b_percentage=conv_data["speaker_b_pct"],
                    toxicity_level=toxicity_level,
                    attachment_style=ai_result.get("attachment_style", "secure"),
                    ghosting_risk=ghosting_risk,
                    patterns_detected=patterns_detected,
                    ai_narrative=ai_result.get("ai_narrative", ""),
                )
                db.add(score)

                for i, point in enumerate(ai_result.get("timeline", [])[:30]):
                    db.add(TimelinePoint(
                        analysis_id=analysis_id,
                        timestamp=str(point.get("timestamp", f"Point {i+1}")),
                        emotional_intensity=float(point.get("emotional_intensity", 50)),
                        sentiment=point.get("sentiment", "neutral"),
                        speaker=point.get("speaker", "a"),
                        sequence_index=i,
                    ))

                db.add(Report(analysis_id=analysis_id, user_id=analysis.user_id))

                # ── Stage 5: Store real token counts ─────────────
                try:
                    analysis.tokens_input  = ai_usage.get("prompt_tokens", 0)
                    analysis.tokens_output = ai_usage.get("completion_tokens", 0)
                    analysis.tokens_total  = ai_usage.get("total_tokens", 0)
                    logger.info(
                        f"[{analysis_id}] Tokens: "
                        f"in={analysis.tokens_input} "
                        f"out={analysis.tokens_output} "
                        f"total={analysis.tokens_total}"
                    )
                except Exception:
                    pass  # Columns may not exist yet — run migrate_tokens.py

                # ── Stage 6: Gen Z verdict ────────────────────────
                try:
                    from app.services.genz_service import generate_genz_verdict, score_to_variant
                    verdict = await generate_genz_verdict(
                        score=overall_score,
                        compatibility=compatibility_score,
                        toxicity=str(toxicity_level.value) if hasattr(toxicity_level, "value") else str(toxicity_level),
                        ghosting_risk=str(ghosting_risk.value) if hasattr(ghosting_risk, "value") else str(ghosting_risk),
                        patterns=patterns_detected,
                        ai_router=ai_router,
                    )
                    analysis.genz_verdict = verdict
                    analysis.card_variant = score_to_variant(overall_score)
                    logger.info(f"[{analysis_id}] Gen Z verdict: {verdict[:60]}...")
                except Exception as gz_err:
                    logger.warning(f"[{analysis_id}] Gen Z verdict failed (non-fatal): {gz_err}")

                # ── Mark complete ─────────────────────────────────
                analysis.status = AnalysisStatus.completed
                await db.commit()
                logger.info(f"[{analysis_id}] ✓ Analysis completed successfully")

            except Exception as e:
                logger.error(f"[{analysis_id}] ✗ Analysis failed: {e}", exc_info=True)
                analysis.status = AnalysisStatus.failed
                analysis.error_message = str(e)
                await db.commit()
                raise

    finally:
        await engine.dispose()
        for path in file_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception:
                pass
