"""
Demo API
--------
Returns a pre-built sample analysis for the landing page.
No auth required. No DB writes.
"""

from fastapi import APIRouter
import random

router = APIRouter()

DEMO_PATTERNS = [
    ["Anxious Attachment", "One-Sided Effort", "Cold Withdrawal", "Passive Aggression"],
    ["Avoidant Behaviour", "Emotional Unavailability", "Ghosting Pattern", "Surface-Level Replies"],
    ["Mutual Warmth", "Secure Attachment", "Healthy Boundaries", "Consistent Effort"],
    ["Love Bombing", "Hot & Cold Behaviour", "Emotional Dependency", "Intermittent Reinforcement"],
]

DEMO_NARRATIVES = [
    "Emotional warmth peaked in the early phase but declined significantly after the midpoint. Conversation initiation shifted from balanced to heavily one-sided. The pattern suggests emotional withdrawal without explicit communication — a classic pre-ghosting dynamic.",
    "The conversation shows genuine mutual interest in the early stages, with warmth and consistent engagement from both parties. However, response times lengthened and emotional depth decreased in later messages, indicating a shift in emotional investment.",
    "Communication patterns reveal a significant imbalance in emotional labour. One party consistently initiates, elaborates, and follows up while the other responds minimally. This asymmetry correlates strongly with reported feelings of emotional exhaustion.",
]


@router.get("/api/demo/analysis")
async def get_demo_analysis():
    """Returns a randomised demo analysis for the landing page."""
    patterns = random.choice(DEMO_PATTERNS)
    narrative = random.choice(DEMO_NARRATIVES)
    compat = random.randint(52, 84)
    health = random.randint(58, 78)
    a_pct = random.randint(28, 45)

    timeline = []
    for i in range(28):
        # Arc: rises then falls
        if i < 8:
            intensity = 60 + i * 3 + random.randint(-5, 5)
        elif i < 18:
            intensity = 80 - (i - 8) * 2 + random.randint(-8, 8)
        else:
            intensity = 60 - (i - 18) * 2.5 + random.randint(-6, 6)
        timeline.append({
            "timestamp": f"Hour {i + 1}",
            "emotional_intensity": max(10, min(98, round(intensity, 1))),
            "sentiment": "positive" if intensity > 65 else ("neutral" if intensity > 45 else "negative"),
            "speaker": "a" if i % 3 == 0 else "b",
        })

    return {
        "id": "demo-analysis",
        "speakers": {"a": "You", "b": "Them"},
        "message_count": random.randint(180, 420),
        "scores": {
            "overall_score": health,
            "compatibility_score": compat,
            "communication_balance": a_pct,
            "speaker_a_percentage": a_pct,
            "speaker_b_percentage": 100 - a_pct,
            "toxicity_level": "medium" if compat < 65 else "low",
            "attachment_style": "anxious" if a_pct < 38 else "secure",
            "ghosting_risk": "high" if compat < 60 else ("medium" if compat < 72 else "low"),
            "patterns_detected": patterns,
            "ai_narrative": narrative,
        },
        "timeline": timeline,
    }
