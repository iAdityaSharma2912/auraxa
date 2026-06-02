"""
WebSocket Status Service
------------------------
Provides real-time analysis progress updates to the frontend.
Falls back gracefully — frontend also polls HTTP as backup.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import asyncio
import json

from app.core.database import AsyncSessionLocal
from app.models.user import Analysis, AnalysisStatus

router = APIRouter()

# In-memory connection store: analysis_id → list of websockets
_connections: dict[str, list[WebSocket]] = {}


async def broadcast_status(analysis_id: str, payload: dict):
    """Called by Celery task (via Redis pub/sub) or directly to push updates."""
    sockets = _connections.get(analysis_id, [])
    dead = []
    for ws in sockets:
        try:
            await ws.send_text(json.dumps(payload))
        except Exception:
            dead.append(ws)
    for ws in dead:
        sockets.remove(ws)


@router.websocket("/ws/status/{analysis_id}")
async def analysis_status_ws(websocket: WebSocket, analysis_id: str):
    """
    Frontend connects here immediately after upload.
    We send status updates every 2s until completed/failed.
    """
    await websocket.accept()

    if analysis_id not in _connections:
        _connections[analysis_id] = []
    _connections[analysis_id].append(websocket)

    STEP_MESSAGES = [
        "Extracting conversation data...",
        "Identifying speakers...",
        "Analysing emotional tone...",
        "Detecting behavioral patterns...",
        "Calculating compatibility...",
        "Building your report...",
    ]
    step_idx = 0

    try:
        while True:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(Analysis).where(Analysis.id == analysis_id)
                )
                analysis = result.scalar_one_or_none()

            if not analysis:
                await websocket.send_text(json.dumps({
                    "status": "failed",
                    "step": "Analysis not found",
                    "progress": 0,
                }))
                break

            if analysis.status == AnalysisStatus.completed:
                await websocket.send_text(json.dumps({
                    "status": "completed",
                    "step": "Analysis complete",
                    "progress": 100,
                }))
                break

            if analysis.status == AnalysisStatus.failed:
                await websocket.send_text(json.dumps({
                    "status": "failed",
                    "step": "Analysis failed",
                    "progress": 0,
                    "error": analysis.error_message,
                }))
                break

            # Still processing — send incremental updates
            progress = min(85, step_idx * 16)
            await websocket.send_text(json.dumps({
                "status": "processing",
                "step": STEP_MESSAGES[step_idx % len(STEP_MESSAGES)],
                "progress": progress,
            }))

            step_idx += 1
            await asyncio.sleep(2.5)

    except WebSocketDisconnect:
        pass
    finally:
        if analysis_id in _connections:
            try:
                _connections[analysis_id].remove(websocket)
            except ValueError:
                pass
