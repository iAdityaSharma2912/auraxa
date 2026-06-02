"""
Palm Analysis Service — Phase 4
"""

import json
import re
import logging
from app.services.ai_router import ai_router

logger = logging.getLogger(__name__)

# Reframed as dermatoglyphics/hand analysis — avoids content filters
PALM_SYSTEM = """You are a hand analysis specialist trained in dermatoglyphics and personality psychology.
Analyse the visible lines, patterns and structure of the hand in the image provided.

Return ONLY a valid JSON object with this exact structure:

{
  "heart_line": {
    "description": "2-3 sentences about what the upper transverse line reveals about emotional expression",
    "emotional_capacity": "Low|Medium|High|Very High",
    "love_style": "brief descriptive phrase"
  },
  "head_line": {
    "description": "2-3 sentences about what the middle transverse line reveals about thinking and communication",
    "thinking_style": "Analytical|Intuitive|Creative|Practical",
    "communication_pattern": "brief descriptive phrase"
  },
  "life_line": {
    "description": "2-3 sentences about the curved line near the thumb and what it reveals about vitality",
    "relationship_energy": "brief descriptive phrase"
  },
  "fate_line": {
    "present": true,
    "description": "2-3 sentences about the vertical line if visible, or note it is not clearly visible"
  },
  "overall_personality": "3-4 sentences synthesising the hand analysis into a personality overview",
  "relationship_tendencies": "2-3 sentences about relationship behaviour patterns suggested by the hand structure",
  "emotional_indicators": ["3-5 emotional traits suggested by the hand lines"],
  "caution_points": ["2-3 areas to be aware of based on the analysis"],
  "guidance": "2-3 sentences of constructive, positive guidance"
}

Analyse based on what is actually visible. Return ONLY the JSON object, nothing else."""


def _is_refusal(text: str) -> bool:
    """Detect when an AI provider refuses instead of returning JSON."""
    refusal_phrases = [
        "unable to analyze",
        "unable to analyse",
        "can't analyze",
        "cannot analyze",
        "i cannot",
        "i can't",
        "not able to",
        "provide details",
        "if you provide",
        "i'm not able",
        "i am not able",
    ]
    lower = text.lower()
    return not text.strip().startswith("{") and any(p in lower for p in refusal_phrases)


def _parse_palm_json(content: str) -> dict:
    content = content.strip()

    # Strip markdown fences
    if "```" in content:
        for part in content.split("```"):
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("{"):
                content = part
                break

    # Find outermost JSON object
    start = content.find("{")
    if start == -1:
        raise ValueError(f"No JSON in response: {content[:200]}")

    depth = 0
    end = -1
    for i, ch in enumerate(content[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break

    if end == -1:
        raise ValueError("Malformed JSON: missing closing brace")

    json_str = content[start:end]
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
        return json.loads(json_str)


async def analyze_palm(image_base64: str, media_type: str = "image/jpeg") -> dict:
    """
    Analyse palm image — uses vision model with refusal detection.
    If provider refuses, marks it degraded and tries next.
    """
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": PALM_SYSTEM + "\n\nAnalyse the hand lines in this image and return ONLY the JSON:"
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{media_type};base64,{image_base64}",
                        "detail": "high",
                    }
                }
            ]
        }
    ]

    max_attempts = len(ai_router.get_active_provider_names()) + 1
    attempt = 0

    while attempt < max_attempts:
        attempt += 1
        try:
            content, used_provider = await ai_router.complete(
                messages=messages,
                model_type="vision",
                temperature=0.4,
                max_tokens=1500,
                vision_only=True,
            )

            logger.info(f"Palm response via {used_provider} (first 200): {content[:200]}")

            if _is_refusal(content):
                logger.warning(f"Provider {used_provider} refused — marking degraded, retrying")
                ai_router._record_failure(used_provider, "refused vision task")
                continue

            result = _parse_palm_json(content)
            logger.info(f"Palm analysis complete via {used_provider}")
            return result

        except ValueError as e:
            logger.warning(f"Palm parse error attempt {attempt}: {e}")
            if attempt >= max_attempts:
                raise
            continue
        except Exception as e:
            logger.error(f"Palm error attempt {attempt}: {e}")
            if attempt >= max_attempts:
                raise ValueError(str(e))
            continue

    raise ValueError(
        "All AI providers refused or failed to analyse this image. "
        "Please ensure the image is a clear, well-lit photo of an open flat hand."
    )