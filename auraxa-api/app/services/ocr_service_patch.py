"""
ocr_service_patch.py
---------------------
Patch to add to ocr_service.py — replaces the plain text reading
section with smart WhatsApp sampling.

In your ocr_service.py, find the section that handles .txt files
(input_type == "text" or file ends in .txt) and replace it with
a call to process_text_file() from here.

OR just call process_text_file() directly from analysis_tasks.py
before passing to ai_service.
"""

import os
from app.services.whatsapp_sampler import (
    parse_whatsapp_export,
    compute_stats,
    smart_sample,
    format_sample_for_ai,
)


def process_text_file(file_path: str) -> dict:
    """
    Process a .txt file (WhatsApp export or plain text) into
    conversation data ready for AI analysis.

    Returns the same structure as structure_conversation() so it
    drops in as a replacement.
    """
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        raw_text = f.read()

    # Try WhatsApp parsing first
    messages = parse_whatsapp_export(raw_text)

    if len(messages) >= 10:
        # Proper WhatsApp export — use smart sampling
        stats     = compute_stats(messages)
        sampled   = smart_sample(messages, target_chars=7000)
        formatted = format_sample_for_ai(sampled, stats, len(messages))

        speaker_a = stats.get("speaker_a", "Person A")
        speaker_b = stats.get("speaker_b", "Person B")

        return {
            "raw_text":      formatted,
            "raw_text_only": True,
            "messages":      [],        # not used for AI — formatted text is used
            "message_count": stats["total_messages"],
            "speakers":      {"a": speaker_a, "b": speaker_b},
            "speaker_a_pct": stats["a_pct"],
            "speaker_b_pct": stats["b_pct"],
            "date_range":    {
                "start": stats.get("date_start", ""),
                "end":   stats.get("date_end", ""),
            },
            "stats":         stats,
            "sampled_count": len(sampled),
        }

    else:
        # Not WhatsApp format — plain text, use as-is
        word_count = len(raw_text.split())
        return {
            "raw_text":      raw_text[:10000],  # first 10k chars for plain text
            "raw_text_only": True,
            "messages":      [],
            "message_count": word_count // 10,  # rough estimate
            "speakers":      {"a": "Person A", "b": "Person B"},
            "speaker_a_pct": 50,
            "speaker_b_pct": 50,
            "date_range":    {},
            "stats":         {},
            "sampled_count": 0,
        }
