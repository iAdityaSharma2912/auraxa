"""
OCR Service — Fixed
--------------------
When structured parsing fails (0 messages found from screenshots),
falls back to raw text mode and lets the AI extract structure itself.
This is more reliable than regex for messy screenshot OCR output.
"""

import re
import cv2
import numpy as np
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


# ─── Image preprocessing ─────────────────────────────────────
def preprocess_image(image_path: str) -> np.ndarray:
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Cannot read image at {image_path}")

    h, w = img.shape[:2]
    if w < 1200:
        scale = 1200 / w
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)
    thresh = cv2.adaptiveThreshold(
        denoised, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )
    return thresh


# ─── OCR extraction ───────────────────────────────────────────
def extract_text_from_image(image_path: str) -> str:
    # Try PaddleOCR first
    try:
        from paddleocr import PaddleOCR
        ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        result = ocr.ocr(image_path, cls=True)
        if result and result[0]:
            lines = [line[1][0] for line in result[0] if line[1][1] > 0.5]
            text = "\n".join(lines)
            if text.strip():
                logger.info(f"PaddleOCR extracted {len(lines)} lines")
                return text
    except Exception as e:
        logger.warning(f"PaddleOCR failed: {e}")

    # Tesseract fallback
    try:
        import pytesseract
        img = preprocess_image(image_path)
        text = pytesseract.image_to_string(img, config="--psm 6")
        logger.info(f"Tesseract extracted {len(text)} chars")
        return text
    except Exception as e:
        logger.error(f"Tesseract failed: {e}")
        return ""


def extract_text_from_txt(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def extract_text_from_json(file_path: str) -> str:
    import json
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    lines = []
    for msg in data.get("messages", []):
        if isinstance(msg.get("text"), str) and msg["text"].strip():
            sender = msg.get("from", "Unknown")
            date = msg.get("date", "")[:10]
            lines.append(f"{date} {sender}: {msg['text']}")
    return "\n".join(lines)


# ─── Message parsing ──────────────────────────────────────────
PATTERNS = [
    # WhatsApp: 12/11/24, 10:32 AM - Alex: message
    re.compile(
        r"(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}),?\s*"
        r"(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\s*[-–]\s*([^:]+?):\s*(.*)"
    ),
    # Bracketed time: [10:32 AM] Alex: message
    re.compile(
        r"\[(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\]\s+([^:]+?):\s*(.*)"
    ),
    # Bracketed date+time: [12/11/24, 10:32 AM] Alex: message
    re.compile(
        r"\[\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4},?\s*"
        r"(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\]\s+([^:]+?):\s*(.*)"
    ),
    # Plain: Alex: message
    re.compile(r"^([A-Za-z][^:]{0,39}):\s+(.+)$"),
]

SKIP_WORDS = [
    "http", "https", "www", "note", "system", "today", "yesterday",
    "message", "delivered", "read", "typing", "online", "ago",
]


def parse_messages(raw_text: str) -> list[dict]:
    messages = []
    lines = raw_text.strip().split("\n")

    for i, line in enumerate(lines):
        line = line.strip()
        if not line or len(line) < 5:
            continue

        matched = False

        # Pattern 0: WhatsApp with date
        m = PATTERNS[0].match(line)
        if m:
            date, time, speaker, content = m.groups()
            messages.append({
                "index": i,
                "timestamp": f"{date} {time}".strip(),
                "speaker": speaker.strip(),
                "content": content.strip(),
            })
            matched = True

        # Pattern 1: [HH:MM] Name: message
        if not matched:
            m = PATTERNS[1].match(line)
            if m:
                time, speaker, content = m.groups()
                messages.append({
                    "index": i,
                    "timestamp": time.strip(),
                    "speaker": speaker.strip(),
                    "content": content.strip(),
                })
                matched = True

        # Pattern 2: [date, time] Name: message
        if not matched:
            m = PATTERNS[2].match(line)
            if m:
                time, speaker, content = m.groups()
                messages.append({
                    "index": i,
                    "timestamp": time.strip(),
                    "speaker": speaker.strip(),
                    "content": content.strip(),
                })
                matched = True

        # Pattern 3: Plain Name: message
        if not matched:
            m = PATTERNS[3].match(line)
            if m:
                speaker, content = m.groups()
                if not any(w in speaker.lower() for w in SKIP_WORDS):
                    messages.append({
                        "index": i,
                        "timestamp": None,
                        "speaker": speaker.strip(),
                        "content": content.strip(),
                    })

    return messages


def detect_speakers(messages: list[dict]) -> tuple[str, str]:
    seen = []
    for msg in messages:
        spk = msg.get("speaker", "")
        if spk and spk not in seen:
            seen.append(spk)
        if len(seen) >= 2:
            break
    a = seen[0] if len(seen) > 0 else "Person A"
    b = seen[1] if len(seen) > 1 else "Person B"
    return a, b


def calculate_speaker_balance(messages, speaker_a, speaker_b):
    total = len(messages)
    if total == 0:
        return 50, 50
    a_count = sum(1 for m in messages if m.get("speaker") == speaker_a)
    return round(a_count / total * 100), round((total - a_count) / total * 100)


def structure_conversation(file_paths: list[str], input_type: str) -> dict:
    """
    Main entry point. Returns structured conversation data.

    When screenshot OCR produces text that can't be parsed into structured
    messages (0 messages found), returns raw_text_only=True so the AI
    can analyse the raw OCR text directly — much more reliable.
    """
    raw_text = ""

    for path in file_paths:
        ext = Path(path).suffix.lower()
        if input_type == "screenshot" or ext in (".jpg", ".jpeg", ".png", ".heic", ".webp"):
            raw_text += extract_text_from_image(path) + "\n"
        elif ext == ".txt":
            raw_text += extract_text_from_txt(path) + "\n"
        elif ext == ".json":
            raw_text += extract_text_from_json(path) + "\n"

    raw_text = raw_text.strip()
    logger.info(f"OCR extracted {len(raw_text)} total characters")

    messages = parse_messages(raw_text)
    logger.info(f"Parser found {len(messages)} structured messages")

    # ── Raw text fallback ─────────────────────────────────────
    # If parsing found <3 messages but we have raw text (happens with
    # screenshots where OCR output doesn't match expected patterns),
    # skip structured parsing and let the AI handle it directly.
    if len(messages) < 3 and len(raw_text) > 100:
        logger.warning(
            f"Only {len(messages)} structured messages found. "
            f"Switching to raw text mode — AI will extract structure."
        )
        return {
            "messages": [],
            "message_count": len(raw_text.split("\n")),  # line count as proxy
            "raw_text_only": True,
            "speakers": {"a": "Person A", "b": "Person B"},
            "speaker_a_pct": 50,
            "speaker_b_pct": 50,
            "date_range": {"start": None, "end": None},
            "raw_text": raw_text[:8000],
        }

    # ── Normal structured mode ────────────────────────────────
    if len(messages) == 0:
        raise ValueError(
            "No text could be extracted from the uploaded file. "
            "Please use the Paste Text option instead."
        )

    speaker_a, speaker_b = detect_speakers(messages)
    a_pct, b_pct = calculate_speaker_balance(messages, speaker_a, speaker_b)

    timestamps = [m["timestamp"] for m in messages if m.get("timestamp")]
    date_range = {
        "start": timestamps[0] if timestamps else None,
        "end": timestamps[-1] if timestamps else None,
    }

    return {
        "messages": messages,
        "message_count": len(messages),
        "raw_text_only": False,
        "speakers": {"a": speaker_a, "b": speaker_b},
        "speaker_a_pct": a_pct,
        "speaker_b_pct": b_pct,
        "date_range": date_range,
        "raw_text": raw_text[:8000],
    }
