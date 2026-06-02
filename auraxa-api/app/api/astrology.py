from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from app.core.security import get_current_user
from app.models.user import User
from app.services.astrology_service import analyze_birth_chart, analyze_compatibility
from app.services.ai_router import ai_router
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class BirthChartRequest(BaseModel):
    dob: str
    name: str = "You"
    birth_time: Optional[str] = None
    birthplace: Optional[str] = None


class CompatibilityRequest(BaseModel):
    person_a_dob: str
    person_a_name: str = "You"
    person_b_dob: str
    person_b_name: str = "Them"


class ChatAstrologyRequest(BaseModel):
    ai_narrative: str
    patterns: List[str] = []
    speakers: dict = {}
    compatibility_score: Optional[int] = None
    attachment_style: Optional[str] = None
    ghosting_risk: Optional[str] = None


def _check_access(user: User) -> None:
    if user.subscription_tier.value == "free":
        raise HTTPException(
            status_code=402,
            detail="Astrology is a Premium feature. Upgrade your plan or redeem a promo code."
        )


@router.post("/chart")
async def get_birth_chart(
    body: BirthChartRequest,
    current_user: User = Depends(get_current_user),
):
    _check_access(current_user)
    try:
        return await analyze_birth_chart(
            dob=body.dob,
            name=body.name,
            birth_time=body.birth_time,
            birthplace=body.birthplace,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/compatibility")
async def get_compatibility(
    body: CompatibilityRequest,
    current_user: User = Depends(get_current_user),
):
    _check_access(current_user)
    try:
        return await analyze_compatibility(
            person_a_dob=body.person_a_dob,
            person_a_name=body.person_a_name,
            person_b_dob=body.person_b_dob,
            person_b_name=body.person_b_name,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/from-chat")
async def astrology_from_chat(
    body: ChatAstrologyRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generate astrological/cosmic relationship reading directly from
    conversation analysis data — no birth dates required.
    """
    _check_access(current_user)

    speaker_a = body.speakers.get("a", "Person A")
    speaker_b = body.speakers.get("b", "Person B")

    system = """You are Auraxa's cosmic relationship analyst — blending astrology, numerology, and 
relationship psychology to provide meaningful cosmic insights.

Given conversation analysis data, provide a cosmic/astrological reading of the relationship dynamics.
Return ONLY a valid JSON object:

{
  "compatibility_score": <integer 0-100, cosmic compatibility>,
  "cosmic_reading": "3-4 sentences cosmic interpretation of the relationship energy",
  "relationship_forecast": "2-3 sentences on the trajectory and potential of this dynamic",
  "strengths": ["3-4 cosmic/energetic strengths of this pairing"],
  "challenges": ["3-4 energetic challenges or karmic lessons"],
  "communication_compatibility": "2 sentences on their communication energy",
  "emotional_compatibility": "2 sentences on their emotional/soul connection",
  "karmic_lesson": "1-2 sentences on the deeper purpose of this connection",
  "guidance": "2-3 sentences of cosmic guidance for navigating this relationship"
}"""

    prompt = f"""Provide a cosmic/astrological reading for the relationship between {speaker_a} and {speaker_b}.

Conversation Analysis Data:
- AI Summary: {body.ai_narrative}
- Patterns: {", ".join(body.patterns)}
- Emotional Compatibility: {body.compatibility_score}%
- Attachment Style: {body.attachment_style}
- Ghosting Risk: {body.ghosting_risk}

Interpret these emotional patterns through a cosmic and astrological lens.
Return ONLY the JSON object."""

    try:
        content, provider = await ai_router.complete(
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": prompt},
            ],
            model_type="analysis",
            temperature=0.65,
            max_tokens=1000,
        )
        logger.info(f"Chat astrology via {provider}")

        content = content.strip()
        if "```" in content:
            for part in content.split("```"):
                part = part.strip().lstrip("json").strip()
                if part.startswith("{"):
                    content = part
                    break

        start = content.find("{")
        end   = content.rfind("}") + 1
        if start != -1 and end > start:
            content = content[start:end]

        return json.loads(content)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cosmic reading failed: {str(e)}")
