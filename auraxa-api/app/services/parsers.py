import re, json
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

@dataclass
class Message:
    sender: str
    content: str
    timestamp: Optional[datetime]
    msg_type: str  # "text" | "media" | "system"

def parse_whatsapp(text: str) -> List[Message]:
    """Parses WhatsApp .txt exports (both 12h and 24h formats)."""
    pattern = re.compile(
        r'^(\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}),?\s'
        rr'(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[aApP][mM])?)\s[-–]\s'
        rr'([^:]+):\s(.+)$', re.MULTILINE
    )
    messages = []
    for m in pattern.finditer(text):
        content = m.group(4).strip()
        msg_type = "media" if "<Media omitted>" in content else "text"
        messages.append(Message(
            sender=m.group(3).strip(),
            content=content,
            timestamp=None,
            msg_type=msg_type
        ))
    return [m for m in messages if m.msg_type == "text"]

def parse_telegram(json_text: str) -> List[Message]:
    """Parses Telegram result.json exports."""
    data = json.loads(json_text)
    messages = []
    for msg in data.get("messages", []):
        if msg.get("type") != "message": continue
        text = msg.get("text", "")
        if isinstance(text, list):
            text = "".join(
                p if isinstance(p, str) else p.get("text", "")
                for p in text
            )
        if not text.strip(): continue
        messages.append(Message(
            sender=msg.get("from", "Unknown"),
            content=text.strip(),
            timestamp=None,
            msg_type="text"
        ))
    return messages

def detect_and_parse(content: str, filename: str) -> List[Message]:
    """Auto-detect format and parse."""
    if filename.endswith(".json"):
        return parse_telegram(content)
    return parse_whatsapp(content)  # Default: WhatsApp .txt

def get_stats(messages: List[Message]) -> dict:
    """Deterministic metrics — no AI needed."""
    senders = list(dict.fromkeys(m.sender for m in messages))
    counts = {s: sum(1 for m in messages if m.sender == s) for s in senders}
    total = len(messages)
    init_balance = round((counts.get(senders[0], 0) / total) * 100) if total > 0 else 50
    return {"total": total, "senders": senders, "counts": counts, "initiation_balance": init_balance}