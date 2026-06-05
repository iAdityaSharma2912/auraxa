"""
Celery Analysis Tasks — saves complete AI result to full_report column
so the frontend gets every section: scoring_breakdown, sub_metrics,
conversation_phases, peak_moments, roast, astrology, red_flags, etc.
"""

import asyncio
import json
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


# ─── Sanitizers ───────────────────────────────────────────

def _safe_int(value, default: int = 50) -> int:
    if isinstance(value, int):
        return max(0, min(100, value))
    if isinstance(value, float):
        return max(0, min(100, int(value)))
    if isinstance(value, str):
        try:
            return max(0, min(100, int(float(value))))
        except (ValueError, TypeError):
            pass
        mapping = {
            "balanced": 50, "equal": 50, "even": 50,
            "unbalanced": 30, "imbalanced": 30,
            "very unbalanced": 15, "heavily unbalanced": 10,
            "slightly unbalanced": 40, "mostly equal": 50,
        }
        return mapping.get(value.lower().strip(), default)
    return default


def _safe_toxicity(value) -> str:
    if isinstance(value, (int, float)):
        n = int(value)
        if n <= 20:  return "low"
        if n <= 45:  return "medium"
        if n <= 75:  return "high"
        return "critical"
    if isinstance(value, str):
        v = value.lower().strip()
        if v in ("low", "medium", "high", "critical"):
            return v
        if v in ("none", "minimal", "healthy", "clean", "very low", "0"):
            return "low"
        if v in ("moderate", "some", "mild", "slight"):
            return "medium"
        if v in ("severe", "very high", "extreme", "toxic"):
            return "critical"
        try:
            n = int(float(v))
            if n <= 20:  return "low"
            if n <= 45:  return "medium"
            if n <= 75:  return "high"
            return "critical"
        except (ValueError, TypeError):
            pass
    return "low"


def _safe_ghosting(value) -> str:
    if isinstance(value, (int, float)):
        n = int(value)
        if n <= 30:  return "low"
        if n <= 65:  return "medium"
        return "high"
    if isinstance(value, str):
        v = value.lower().strip()
        if v in ("low", "medium", "high"):
            return v
        if v in ("none", "minimal", "unlikely", "stable", "very low"):
            return "low"
        if v in ("moderate", "possible", "some"):
            return "medium"
        if v in ("likely", "probable", "very high", "imminent"):
            return "high"
        try:
            n = int(float(v))
            if n <= 30:  return "low"
            if n <= 65:  return "medium"
            return "high"
        except (ValueError, TypeError):
            pass
    return "low"


def _safe_attachment(value) -> str:
    if isinstance(value, str):
        v = value.lower().strip()
        if v in ("secure", "anxious", "avoidant", "disorganized"):
            return v
        if any(x in v for x in ("anxious", "preoccupied", "clingy")):
            return "anxious"
        if any(x in v for x in ("avoidant", "dismissive", "distant")):
            return "avoidant"
        if any(x in v for x in ("disorganized", "fearful", "chaotic")):
            return "disorganized"
    return "secure"


# ─── Async runner ─────────────────────────────────────────

def run_async(coro):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        try:
            pending = asyncio.all_tasks(loop)
            for task in pending:
                task.cancel()
            if pending:
                loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
        except Exception:
            pass
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
def run_analysis_task(self, analysis_id: str, file_paths: list, input_type: str, intent: str):
    logger.info(f"[{analysis_id}] Task started — input_type={input_type} intent={intent}")
    return run_async(_run_pipeline(analysis_id, file_paths, input_type, intent))


async def _run_pipeline(analysis_id: str, file_paths: list, input_type: str, intent: str):
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
    from sqlalchemy import select, text
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
                # ── Stage 1: Mark processing ──────────────
                analysis.status = AnalysisStatus.processing
                await db.commit()
                logger.info(f"[{analysis_id}] Stage 1: Processing started")

                # ── Stage 2: OCR / structure ──────────────
                logger.info(f"[{analysis_id}] Stage 2: Structuring from {len(file_paths)} file(s)")
                if input_type in ("text", "paste") and file_paths:
                    from app.services.ocr_service_patch import process_text_file
                    conv_data = process_text_file(file_paths[0])
                else:
                    conv_data = structure_conversation(file_paths, input_type)
                raw_text_only = conv_data.get("raw_text_only", False)

                if raw_text_only:
                    logger.info(f"[{analysis_id}] Raw text mode — AI extracts structure")
                    analysis.speakers      = conv_data["speakers"]
                    analysis.raw_messages  = []
                    analysis.message_count = conv_data["message_count"]
                    analysis.date_range    = conv_data["date_range"]
                else:
                    if conv_data["message_count"] == 0:
                        raise ValueError(
                            "No text could be extracted from the file. "
                            "Please use the Paste Text option instead."
                        )
                    analysis.speakers      = conv_data["speakers"]
                    analysis.raw_messages  = conv_data["messages"][:200]
                    analysis.message_count = conv_data["message_count"]
                    analysis.date_range    = conv_data["date_range"]

                await db.commit()
                logger.info(f"[{analysis_id}] Stage 2 complete: {conv_data['message_count']} msgs")

                # ── Stage 3: AI analysis ──────────────────
                logger.info(f"[{analysis_id}] Stage 3: Running AI analysis")
                ai_result, ai_usage = await run_emotional_analysis(conv_data, intent)
                from app.tasks.normalize_ai_result import normalize  # ← ADD
                ai_result = normalize(ai_result)                     # ← ADD

                if raw_text_only and conv_data.get("speakers") != {"a": "Person A", "b": "Person B"}:
                    analysis.speakers = conv_data["speakers"]

                # Sanitize enum fields
                overall_score         = _safe_int(ai_result.get("overall_score", 50))
                compatibility_score   = _safe_int(ai_result.get("compatibility_score", 50))
                communication_balance = _safe_int(ai_result.get("communication_balance", 50))
                toxicity_level        = _safe_toxicity(ai_result.get("toxicity_level", "low"))
                ghosting_risk         = _safe_ghosting(ai_result.get("ghosting_risk", "low"))
                attachment_style      = _safe_attachment(ai_result.get("attachment_style", "secure"))
                patterns_detected     = ai_result.get("patterns_detected", [])
                if not isinstance(patterns_detected, list):
                    patterns_detected = []

                logger.info(
                    f"[{analysis_id}] Stage 3 complete: score={overall_score} "
                    f"tox={toxicity_level} ghost={ghosting_risk} "
                    f"tokens={ai_usage.get('total_tokens', 0)}"
                )

                # ── Stage 4: Save EmotionalScore ──────────
                score = EmotionalScore(
                    analysis_id=analysis_id,
                    overall_score=overall_score,
                    compatibility_score=compatibility_score,
                    communication_balance=communication_balance,
                    speaker_a_percentage=_safe_int(conv_data.get("speaker_a_pct", 50)),
                    speaker_b_percentage=_safe_int(conv_data.get("speaker_b_pct", 50)),
                    toxicity_level=toxicity_level,
                    attachment_style=attachment_style,
                    ghosting_risk=ghosting_risk,
                    patterns_detected=patterns_detected,
                    ai_narrative=str(ai_result.get("ai_narrative", ""))[:2000],
                )
                db.add(score)

                # ── Stage 5: Timeline points ──────────────
                for i, point in enumerate(ai_result.get("timeline", [])[:30]):
                    try:
                        db.add(TimelinePoint(
                            analysis_id=analysis_id,
                            timestamp=str(point.get("timestamp", f"Point {i+1}"))[:100],
                            emotional_intensity=float(point.get("emotional_intensity", 50)),
                            sentiment=str(point.get("sentiment", "neutral")),
                            speaker=str(point.get("speaker", "a")),
                            sequence_index=i,
                        ))
                    except Exception:
                        pass

                # ── Stage 6: Save full_report JSONB ───────
                #
                # This is the key step — we store the COMPLETE ai_result
                # so the frontend gets every section:
                # scoring_breakdown, sub_metrics, conversation_phases,
                # peak_moments, key_topics, roast, astrology, red_flags,
                # green_flags, hard_truths, therapist_note, etc.
                #
                full_report_data = {
                    "scoring_breakdown":             ai_result.get("scoring_breakdown"),
                    "sub_metrics":                   ai_result.get("sub_metrics"),
                    "hard_truths":                   ai_result.get("hard_truths", []),
                    "key_topics":                    ai_result.get("key_topics", []),
                    "conversation_phases":           ai_result.get("conversation_phases", []),
                    "conversation_themes":           ai_result.get("conversation_themes"),
                    "peak_moments":                  ai_result.get("peak_moments"),
                    "emotional_moments":             ai_result.get("emotional_moments"),
                    "communication_analysis":        ai_result.get("communication_analysis"),
                    "red_flags":                     ai_result.get("red_flags", []),
                    "green_flags":                   ai_result.get("green_flags", []),
                    "relationship_health_indicators": ai_result.get("relationship_health_indicators"),
                    "roast":                         ai_result.get("roast"),
                    "astrology_reading":             ai_result.get("astrology_reading"),
                    "what_this_reveals":             ai_result.get("what_this_reveals"),
                    "therapist_note":                ai_result.get("therapist_note"),
                    "genz_verdict":                  ai_result.get("genz_verdict"),
                }

                try:
                    # Use raw SQL to upsert to avoid model column dependency
                    await db.execute(
                        text("""
                            UPDATE analyses
                            SET full_report = :full_report
                            WHERE id = :analysis_id
                        """),
                        {
                            "full_report": json.dumps(full_report_data),
                            "analysis_id": analysis_id,
                        },
                    )
                    logger.info(f"[{analysis_id}] full_report saved ✓")
                except Exception as fr_err:
                    # Non-fatal — basic scores still saved
                    logger.warning(f"[{analysis_id}] full_report save failed (non-fatal): {fr_err}")

                # ── Stage 7: Create Report record ─────────
                db.add(Report(analysis_id=analysis_id, user_id=analysis.user_id))

                # ── Stage 8: Token counts ─────────────────
                try:
                    analysis.tokens_input  = ai_usage.get("prompt_tokens", 0)
                    analysis.tokens_output = ai_usage.get("completion_tokens", 0)
                    analysis.tokens_total  = ai_usage.get("total_tokens", 0)
                except Exception:
                    pass

                # ── Stage 9: Gen Z verdict ────────────────
                try:
                    from app.services.genz_service import generate_genz_verdict, score_to_variant
                    verdict = await generate_genz_verdict(
                        score=overall_score,
                        compatibility=compatibility_score,
                        toxicity=toxicity_level,
                        ghosting_risk=ghosting_risk,
                        patterns=patterns_detected,
                        ai_router=ai_router,
                    )
                    analysis.genz_verdict = verdict
                    analysis.card_variant = score_to_variant(overall_score)
                    logger.info(f"[{analysis_id}] Gen Z verdict: {verdict[:60]}...")
                except Exception as gz_err:
                    logger.warning(f"[{analysis_id}] Gen Z verdict failed (non-fatal): {gz_err}")

                # ── Stage 10: Mark complete ────────────────
                analysis.status = AnalysisStatus.completed
                await db.commit()
                logger.info(f"[{analysis_id}] ✓ Analysis completed successfully")

            except Exception as e:
                logger.error(f"[{analysis_id}] ✗ Analysis failed: {e}", exc_info=True)
                try:
                    await db.rollback()
                except Exception:
                    pass
                try:
                    analysis.status = AnalysisStatus.failed
                    analysis.error_message = str(e)[:500]
                    await db.commit()
                except Exception:
                    pass
                raise

    finally:
        await engine.dispose()
        for path in file_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception:
                pass
