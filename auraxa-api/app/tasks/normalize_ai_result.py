"""
normalize_ai_result.py
-----------------------
The AI sometimes returns slightly different field names than the schema specifies.
This normalizer maps ALL common variations to the exact field names the frontend expects.

Call this BEFORE saving full_report_data.
"""


def normalize(result: dict) -> dict:
    """Normalize AI result dict to match frontend-expected field names."""
    if not isinstance(result, dict):
        return result

    out = dict(result)

    # ── conversation_phases ───────────────────────────────
    phases = (
        out.get("conversation_phases") or
        out.get("phases") or
        out.get("conversation_phase") or
        []
    )
    if isinstance(phases, list):
        out["conversation_phases"] = [_norm_phase(p, i + 1) for i, p in enumerate(phases)]

    # ── key_topics ────────────────────────────────────────
    topics = (
        out.get("key_topics") or
        out.get("topics") or
        out.get("main_topics") or
        out.get("discussed_topics") or
        []
    )
    if isinstance(topics, list):
        out["key_topics"] = [_norm_topic(t) for t in topics]

    # ── red_flags ─────────────────────────────────────────
    red = (
        out.get("red_flags") or
        out.get("redFlags") or
        out.get("red_flag_list") or
        []
    )
    if isinstance(red, list):
        out["red_flags"] = [_norm_flag(f, "red") for f in red]

    # ── green_flags ───────────────────────────────────────
    green = (
        out.get("green_flags") or
        out.get("greenFlags") or
        out.get("green_flag_list") or
        []
    )
    if isinstance(green, list):
        out["green_flags"] = [_norm_flag(f, "green") for f in green]

    # ── scoring_breakdown ─────────────────────────────────
    sb = (
        out.get("scoring_breakdown") or
        out.get("score_breakdown") or
        out.get("breakdown") or
        out.get("scores_breakdown") or
        {}
    )
    if isinstance(sb, dict):
        out["scoring_breakdown"] = _norm_scoring_breakdown(sb)

    # ── sub_metrics ───────────────────────────────────────
    sm = (
        out.get("sub_metrics") or
        out.get("subMetrics") or
        out.get("sub_metric") or
        out.get("metrics") or
        {}
    )
    if isinstance(sm, dict):
        out["sub_metrics"] = _norm_sub_metrics(sm)

    # ── peak_moments ──────────────────────────────────────
    pk = (
        out.get("peak_moments") or
        out.get("peakMoments") or
        out.get("peaks") or
        out.get("key_moments") or
        {}
    )
    if isinstance(pk, dict):
        out["peak_moments"] = _norm_peak_moments(pk)

    # ── relationship_health_indicators ────────────────────
    hi = (
        out.get("relationship_health_indicators") or
        out.get("health_indicators") or
        out.get("relationship_health") or
        out.get("health") or
        {}
    )
    if isinstance(hi, dict):
        out["relationship_health_indicators"] = _norm_health(hi)

    # ── communication_analysis ────────────────────────────
    comm = (
        out.get("communication_analysis") or
        out.get("communication") or
        out.get("comm_analysis") or
        {}
    )
    if isinstance(comm, dict):
        out["communication_analysis"] = _norm_comm(comm)

    # ── roast ─────────────────────────────────────────────
    roast = (
        out.get("roast") or
        out.get("the_roast") or
        {}
    )
    if isinstance(roast, dict):
        out["roast"] = _norm_roast(roast)

    # ── astrology_reading ─────────────────────────────────
    astro = (
        out.get("astrology_reading") or
        out.get("astrology") or
        out.get("astrological_reading") or
        {}
    )
    if isinstance(astro, dict):
        out["astrology_reading"] = _norm_astro(astro)

    # ── conversation_themes ───────────────────────────────
    themes = (
        out.get("conversation_themes") or
        out.get("themes") or
        {}
    )
    if isinstance(themes, dict):
        out["conversation_themes"] = themes

    # ── simple string fields with fallbacks ───────────────
    out["what_this_reveals"] = (
        out.get("what_this_reveals") or
        out.get("what_this_actually_reveals") or
        out.get("reveals") or
        None
    )
    out["therapist_note"] = (
        out.get("therapist_note") or
        out.get("therapist_notes") or
        out.get("clinical_note") or
        out.get("a_note") or
        None
    )
    out["hard_truths"] = (
        out.get("hard_truths") or
        out.get("hard_truth") or
        out.get("uncomfortable_truths") or
        []
    )
    out["emotional_moments"] = (
        out.get("emotional_moments") or
        out.get("key_emotional_moments") or
        out.get("moments") or
        {}
    )
    out["genz_verdict"] = (
        out.get("genz_verdict") or
        out.get("gen_z_verdict") or
        out.get("verdict") or
        None
    )

    # Fallback scoring_breakdown if empty
    sb_check = out.get("scoring_breakdown") or {}
    if not any(v for v in sb_check.values() if v is not None):
        out["scoring_breakdown"] = {
            "emotional_health":      _coerce_int(out.get("overall_score")),
            "emotional_health_note": "",
            "compatibility":         _coerce_int(out.get("compatibility_score")),
            "compatibility_note":    "",
            "toxicity_score":        None,
            "toxicity_note":         "",
            "ghosting_score":        None,
            "ghosting_note":         "",
        }

    return out


# ── Phase normalizer ──────────────────────────────────────
def _norm_phase(p: dict, idx: int = 1) -> dict:
    if not isinstance(p, dict):
        return {
            "phase_number": idx,
            "phase_name": str(p),
            "description": "",
            "dominant_emotion": "",
            "shift_trigger": "",
            "red_or_green": "neutral",
        }
    return {
        "phase_number": (
            p.get("phase_number") or p.get("number") or p.get("phase_num") or p.get("num") or idx
        ),
        "phase_name": (
            p.get("phase_name") or p.get("name") or p.get("title") or p.get("phase") or "Phase"
        ),
        "description": (
            p.get("description") or p.get("desc") or p.get("summary") or p.get("detail") or ""
        ),
        "dominant_emotion": (
            p.get("dominant_emotion") or p.get("emotion") or p.get("dominant_feeling") or ""
        ),
        "shift_trigger": (
            p.get("shift_trigger") or p.get("trigger") or p.get("transition") or p.get("shift") or ""
        ),
        "red_or_green": (
            p.get("red_or_green") or p.get("type") or p.get("flag") or p.get("valence") or "neutral"
        ),
    }


# ── Topic normalizer ──────────────────────────────────────
def _norm_topic(t: dict) -> dict:
    if not isinstance(t, dict):
        return {"topic": str(t), "frequency": "medium", "sentiment": "neutral", "description": ""}

    return {
        "topic": (
            t.get("topic") or t.get("name") or t.get("title") or t.get("subject") or "Unknown"
        ),
        "frequency": (
            t.get("frequency") or t.get("freq") or t.get("occurrence") or "medium"
        ),
        "sentiment": (
            t.get("sentiment") or t.get("tone") or t.get("emotion") or "neutral"
        ),
        "description": (
            t.get("description") or t.get("desc") or t.get("summary") or t.get("detail") or ""
        ),
    }


# ── Flag normalizer ───────────────────────────────────────
def _norm_flag(f: dict, kind: str) -> dict:
    if not isinstance(f, dict):
        return {"flag": str(f), "severity": "minor", "evidence": ""}

    return {
        "flag": (
            f.get("flag") or f.get("issue") or f.get("title") or f.get("name") or
            f.get("description") or f.get("concern") or f.get("pattern") or "Unknown"
        ),
        "severity": f.get("severity") or f.get("level") or ("minor" if kind == "red" else None),
        "evidence": (
            f.get("evidence") or f.get("example") or f.get("detail") or
            f.get("explanation") or f.get("context") or ""
        ),
    }


# ── Scoring breakdown normalizer ──────────────────────────
def _norm_scoring_breakdown(sb: dict) -> dict:
    if not sb:
        return {}

    # AI sometimes puts scores directly at top level result too
    # so we check both sb and result (passed as optional param)
    def pick(sb_key, fallback_keys=None):
        v = sb.get(sb_key)
        if v is not None:
            return _coerce_int(v)
        for k in (fallback_keys or []):
            v = sb.get(k)
            if v is not None:
                return _coerce_int(v)
        return None

    return {
        "emotional_health":      pick("emotional_health",  ["emotional_health_score", "health", "emotional", "overall_health"]),
        "emotional_health_note": sb.get("emotional_health_note") or sb.get("health_note") or "",
        "compatibility":         pick("compatibility",     ["compatibility_score", "compat"]),
        "compatibility_note":    sb.get("compatibility_note") or sb.get("compat_note") or "",
        "toxicity_score":        pick("toxicity_score",    ["toxicity", "tox_score", "tox"]),
        "toxicity_note":         sb.get("toxicity_note")   or sb.get("tox_note") or "",
        "ghosting_score":        pick("ghosting_score",    ["ghosting", "ghost_score", "ghost"]),
        "ghosting_note":         sb.get("ghosting_note")   or sb.get("ghost_note") or "",
    }

# ── Sub-metrics normalizer ────────────────────────────────
def _norm_sub_metrics(sm: dict) -> dict:
    if not sm:
        return {}

    # Initiation balance
    ib = sm.get("initiation_balance") or sm.get("initiation") or {}
    if isinstance(ib, dict):
        ib = {
            "person_a_pct": _coerce_int(ib.get("person_a_pct") or ib.get("a_pct") or ib.get("person_a") or ib.get("a")),
            "person_b_pct": _coerce_int(ib.get("person_b_pct") or ib.get("b_pct") or ib.get("person_b") or ib.get("b")),
            "who_initiates_more": ib.get("who_initiates_more") or ib.get("initiator") or ib.get("who_starts") or "equal",
            "note": ib.get("note") or ib.get("description") or "",
        }

    # Response time trend
    rt = sm.get("response_time_trend") or sm.get("response_trend") or sm.get("response_time") or {}
    if isinstance(rt, dict):
        rt = {
            "trend": rt.get("trend") or rt.get("direction") or rt.get("pattern") or "stable",
            "person_a_trend": rt.get("person_a_trend") or rt.get("a_trend") or rt.get("a") or "",
            "person_b_trend": rt.get("person_b_trend") or rt.get("b_trend") or rt.get("b") or "",
            "note": rt.get("note") or rt.get("description") or "",
        }

    # Sentiment arc
    sa = sm.get("sentiment_arc") or sm.get("sentiment") or {}
    if isinstance(sa, dict):
        sa = {
            "early_sentiment":  sa.get("early_sentiment")  or sa.get("early")  or sa.get("start") or "neutral",
            "middle_sentiment": sa.get("middle_sentiment") or sa.get("middle") or sa.get("mid")   or "neutral",
            "recent_sentiment": sa.get("recent_sentiment") or sa.get("recent") or sa.get("end")   or "neutral",
            "arc_direction":    sa.get("arc_direction")    or sa.get("direction") or sa.get("arc") or "stable",
            "note": sa.get("note") or sa.get("description") or "",
        }

    # Affection signals
    af = sm.get("affection_signals") or sm.get("affection") or {}
    if isinstance(af, dict):
        af = {
            "count":         _coerce_int(af.get("count") or af.get("total") or af.get("number") or 0),
            "quality":       af.get("quality") or af.get("level") or "medium",
            "who_shows_more": af.get("who_shows_more") or af.get("who") or af.get("primary") or "equal",
            "examples":      af.get("examples") or af.get("types") or af.get("forms") or [],
            "note":          af.get("note") or af.get("description") or "",
        }

    return {
        "initiation_balance":   ib,
        "response_time_trend":  rt,
        "sentiment_arc":        sa,
        "affection_signals":    af,
    }


# ── Peak moments normalizer ───────────────────────────────
def _norm_peak_moments(pk: dict) -> dict:
    if not pk:
        return {}

    def norm_point(p):
        if not isinstance(p, dict):
            return None
        return {
            "description": p.get("description") or p.get("moment") or p.get("text") or p.get("event") or "",
            "why_it_mattered": p.get("why_it_mattered") or p.get("why") or p.get("significance") or p.get("impact") or "",
            "what_it_revealed": p.get("what_it_revealed") or p.get("revealed") or p.get("insight") or "",
        }

    return {
        "highest_point":         norm_point(pk.get("highest_point") or pk.get("best_moment") or pk.get("peak") or {}),
        "lowest_point":          norm_point(pk.get("lowest_point")  or pk.get("worst_moment") or pk.get("trough") or {}),
        "turning_point":         pk.get("turning_point") or pk.get("turning") or pk.get("pivot") or "",
        "most_authentic_moment": pk.get("most_authentic_moment") or pk.get("authentic") or pk.get("genuine_moment") or "",
    }


# ── Health indicators normalizer ──────────────────────────
def _norm_health(hi: dict) -> dict:
    if not hi:
        return {}
    return {
        "mutual_respect":    _coerce_int(hi.get("mutual_respect")   or hi.get("respect")),
        "emotional_safety":  _coerce_int(hi.get("emotional_safety") or hi.get("safety")),
        "authenticity":      _coerce_int(hi.get("authenticity")     or hi.get("genuine")),
        "reciprocity":       _coerce_int(hi.get("reciprocity")      or hi.get("balance")),
        "growth_potential":  _coerce_int(hi.get("growth_potential") or hi.get("growth")),
    }


# ── Communication normalizer ──────────────────────────────
def _norm_comm(comm: dict) -> dict:
    if not comm:
        return {}
    return {
        "who_initiates_more":    comm.get("who_initiates_more")    or comm.get("initiator")        or comm.get("who_starts") or "",
        "initiation_percentage": comm.get("initiation_percentage") or comm.get("initiation_split") or comm.get("split") or "",
        "response_style_a":      comm.get("response_style_a")      or comm.get("style_a")          or comm.get("person_a_style") or "",
        "response_style_b":      comm.get("response_style_b")      or comm.get("style_b")          or comm.get("person_b_style") or "",
        "humor_level":           comm.get("humor_level")           or comm.get("humor")            or "",
        "affection_shown":       comm.get("affection_shown")       or comm.get("affection")        or "",
        "conflict_style":        comm.get("conflict_style")        or comm.get("conflict")         or "",
        "power_dynamic":         comm.get("power_dynamic")         or comm.get("dynamic")          or comm.get("power") or "",
    }


# ── Roast normalizer ──────────────────────────────────────
def _norm_roast(r: dict) -> dict:
    if not r:
        return {}
    return {
        "person_a_roast":    r.get("person_a_roast")    or r.get("roast_a") or r.get("a_roast") or "",
        "person_b_roast":    r.get("person_b_roast")    or r.get("roast_b") or r.get("b_roast") or "",
        "relationship_roast": r.get("relationship_roast") or r.get("relationship") or r.get("couple_roast") or "",
        "roast_verdict":     r.get("roast_verdict")     or r.get("verdict") or r.get("final_verdict") or "",
    }


# ── Astrology normalizer ──────────────────────────────────
def _norm_astro(a: dict) -> dict:
    if not a:
        return {}
    return {
        "inferred_sign_a":     a.get("inferred_sign_a") or a.get("sign_a") or a.get("sign_person_a") or "",
        "inferred_sign_b":     a.get("inferred_sign_b") or a.get("sign_b") or a.get("sign_person_b") or "",
        "cosmic_compatibility": a.get("cosmic_compatibility") or a.get("compatibility") or "",
        "element_dynamic":     a.get("element_dynamic") or a.get("elements") or "",
        "mercury_reading":     a.get("mercury_reading") or a.get("mercury") or "",
        "venus_reading":       a.get("venus_reading")   or a.get("venus")   or "",
        "saturn_truth":        a.get("saturn_truth")    or a.get("saturn")  or "",
        "cosmic_verdict":      a.get("cosmic_verdict")  or a.get("verdict") or "",
    }


# ── Util ──────────────────────────────────────────────────
def _coerce_int(v) -> int | None:
    if v is None:
        return None
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None
