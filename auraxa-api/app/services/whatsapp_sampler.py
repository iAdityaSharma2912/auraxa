"""
whatsapp_sampler.py
--------------------
Properly parses WhatsApp .txt exports and creates a smart sample
that represents the FULL conversation — not just the beginning.

Strategy:
  - Parse ALL messages
  - Extract full statistics (counts, dates, per-person breakdown)
  - Sample: 15% early + 40% middle + 45% recent (recency-weighted)
  - Pass stats + sample to AI so it understands full scope
"""

import re
import random
from datetime import datetime
from collections import Counter


# ── WhatsApp timestamp patterns ───────────────────────────
# Supports: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
# Supports: 12h (3:45 PM) and 24h (15:45)
WA_PATTERNS = [
    # 06/05/2026, 3:45 PM - Name: message
    r"^(\d{1,2}/\d{1,2}/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?\s*[AP]M)\s*[-–]\s*([^:]+):\s*(.+)$",
    # 06/05/2026, 15:45 - Name: message
    r"^(\d{1,2}/\d{1,2}/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–]\s*([^:]+):\s*(.+)$",
    # [06/05/2026, 3:45 PM] Name: message  (iOS format)
    r"^\[(\d{1,2}/\d{1,2}/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?\s*[AP]M)\]\s*([^:]+):\s*(.+)$",
    # 2026-05-06, 15:45 - Name: message
    r"^(\d{4}-\d{2}-\d{2}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–]\s*([^:]+):\s*(.+)$",
]


def parse_whatsapp_export(text: str) -> list[dict]:
    """
    Parse a WhatsApp .txt export into a list of message dicts.
    Returns: [{"date": str, "time": str, "sender": str, "text": str}]
    """
    messages = []
    lines = text.split("\n")
    current_msg = None

    for line in lines:
        line = line.strip()
        if not line:
            continue

        matched = False
        for pattern in WA_PATTERNS:
            m = re.match(pattern, line, re.IGNORECASE)
            if m:
                if current_msg:
                    messages.append(current_msg)
                groups = m.groups()
                # Skip system messages
                sender = groups[2].strip()
                text   = groups[3].strip()
                if _is_system_message(sender, text):
                    current_msg = None
                    matched = True
                    break
                current_msg = {
                    "date":   groups[0].strip(),
                    "time":   groups[1].strip(),
                    "sender": sender,
                    "text":   text,
                }
                matched = True
                break

        if not matched and current_msg:
            # Continuation line — append to last message
            current_msg["text"] += " " + line

    if current_msg:
        messages.append(current_msg)

    return messages


def _is_system_message(sender: str, text: str) -> bool:
    """Filter out WhatsApp system messages."""
    system_phrases = [
        "messages and calls are end-to-end encrypted",
        "created group",
        "added you",
        "changed the group",
        "left",
        "removed",
        "changed their phone number",
        "security code changed",
        "null",
        "<media omitted>",
        "image omitted",
        "video omitted",
        "audio omitted",
        "document omitted",
        "sticker omitted",
        "gif omitted",
        "contact card omitted",
        "location: ",
        "live location shared",
        "this message was deleted",
        "you deleted this message",
    ]
    text_lower = text.lower()
    for phrase in system_phrases:
        if phrase in text_lower:
            return True
    # Very short system-like messages
    if len(text) < 3:
        return True
    return False


def compute_stats(messages: list[dict]) -> dict:
    """
    Compute full conversation statistics from ALL messages.
    This gets passed to AI as context even when we sample.
    """
    if not messages:
        return {}

    # Speaker counts
    sender_counts = Counter(m["sender"] for m in messages)
    total = len(messages)

    # Identify the two main speakers
    top_speakers = sender_counts.most_common(2)
    speaker_a = top_speakers[0][0] if top_speakers else "Person A"
    speaker_b = top_speakers[1][0] if len(top_speakers) > 1 else "Person B"
    a_count   = sender_counts.get(speaker_a, 0)
    b_count   = sender_counts.get(speaker_b, 0)

    # Date range
    first_date = messages[0]["date"] + " " + messages[0]["time"]
    last_date  = messages[-1]["date"] + " " + messages[-1]["time"]

    # Average message length
    avg_len_a = 0
    avg_len_b = 0
    msgs_a = [m["text"] for m in messages if m["sender"] == speaker_a]
    msgs_b = [m["text"] for m in messages if m["sender"] == speaker_b]
    if msgs_a:
        avg_len_a = round(sum(len(t) for t in msgs_a) / len(msgs_a))
    if msgs_b:
        avg_len_b = round(sum(len(t) for t in msgs_b) / len(msgs_b))

    # Conversation intensity over time — split into 10 buckets
    bucket_size = max(total // 10, 1)
    buckets = []
    for i in range(0, total, bucket_size):
        chunk = messages[i:i + bucket_size]
        buckets.append(len(chunk))

    # Response pattern: who replies to whom
    consecutive_same = 0
    for i in range(1, min(len(messages), 200)):
        if messages[i]["sender"] == messages[i - 1]["sender"]:
            consecutive_same += 1
    double_text_rate = round((consecutive_same / min(total, 200)) * 100)

    return {
        "total_messages":   total,
        "speaker_a":        speaker_a,
        "speaker_b":        speaker_b,
        "a_count":          a_count,
        "b_count":          b_count,
        "a_pct":            round((a_count / total) * 100) if total else 50,
        "b_pct":            round((b_count / total) * 100) if total else 50,
        "date_start":       first_date,
        "date_end":         last_date,
        "avg_len_a":        avg_len_a,
        "avg_len_b":        avg_len_b,
        "double_text_rate": double_text_rate,
        "intensity_curve":  buckets[:10],
    }


def smart_sample(messages: list[dict], target_chars: int = 7000) -> list[dict]:
    """
    Sample messages intelligently across the FULL conversation.

    Distribution (recency-weighted):
      - Early   (0-15%)  : 15% of sample
      - Middle  (15-55%) : 30% of sample
      - Recent  (55-85%) : 30% of sample
      - Latest  (85-100%): 25% of sample   ← most important

    If conversation fits in target_chars, return all messages.
    """
    total = len(messages)
    if total == 0:
        return []

    # Check if full conversation fits
    full_text = "\n".join(f"{m['sender']}: {m['text']}" for m in messages)
    if len(full_text) <= target_chars:
        return messages  # Small conversation — use everything

    # Calculate how many messages we can fit
    avg_msg_len = len(full_text) / total
    target_count = min(int(target_chars / max(avg_msg_len, 10)), total)

    # Define zones
    early_end   = int(total * 0.15)
    middle_end  = int(total * 0.55)
    recent_end  = int(total * 0.85)

    early   = messages[0          : early_end]
    middle  = messages[early_end  : middle_end]
    recent  = messages[middle_end : recent_end]
    latest  = messages[recent_end : total]

    # Allocate sample counts
    n_early  = max(int(target_count * 0.15), min(10, len(early)))
    n_middle = max(int(target_count * 0.30), min(20, len(middle)))
    n_recent = max(int(target_count * 0.30), min(20, len(recent)))
    n_latest = max(int(target_count * 0.25), min(15, len(latest)))

    # Sample each zone — keep chronological order within zone
    def sample_zone(zone: list, n: int) -> list:
        if len(zone) <= n:
            return zone
        # Evenly spaced — not random, so we get representative spread
        step = len(zone) / n
        return [zone[int(i * step)] for i in range(n)]

    sampled = (
        sample_zone(early, n_early) +
        sample_zone(middle, n_middle) +
        sample_zone(recent, n_recent) +
        sample_zone(latest, n_latest)
    )

    return sampled


def format_sample_for_ai(
    sampled_messages: list[dict],
    stats: dict,
    total_messages: int,
) -> str:
    """
    Format the sampled messages into a prompt-ready string.
    Includes full stats as context header.
    """
    speaker_a = stats.get("speaker_a", "Person A")
    speaker_b = stats.get("speaker_b", "Person B")
    a_pct     = stats.get("a_pct", 50)
    b_pct     = stats.get("b_pct", 50)

    header = f"""=== CONVERSATION STATISTICS (FULL {total_messages} MESSAGES) ===
Speakers: {speaker_a} ({a_pct}%) and {speaker_b} ({b_pct}%)
Date range: {stats.get("date_start", "?")} to {stats.get("date_end", "?")}
Total messages: {total_messages}
{speaker_a} sent: {stats.get("a_count", "?")} messages (avg {stats.get("avg_len_a", "?")} chars each)
{speaker_b} sent: {stats.get("b_count", "?")} messages (avg {stats.get("avg_len_b", "?")} chars each)
Double-texting rate: {stats.get("double_text_rate", "?")}% of messages are consecutive from same person

=== REPRESENTATIVE SAMPLE ({len(sampled_messages)} messages from across full conversation) ===
NOTE: This sample spans the ENTIRE conversation — early, middle, and recent.
Analyze as if you've read the complete {total_messages}-message conversation.

"""

    lines = []
    last_date = None
    for msg in sampled_messages:
        # Add date divider when date changes
        if msg["date"] != last_date:
            lines.append(f"\n[{msg['date']}]")
            last_date = msg["date"]
        lines.append(f"{msg['sender']} [{msg['time']}]: {msg['text']}")

    return header + "\n".join(lines)
