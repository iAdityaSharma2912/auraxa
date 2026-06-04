/**
 * generateReportPDF.ts — fixed version
 * - No emojis (break in Helvetica)
 * - No unicode arrows/bullets/checkmarks
 * - No alpha in setFillColor (not supported in jsPDF)
 */

export async function generateReportPDF(result: any): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W        = 210;
  const MARGIN   = 16;
  const CW       = W - MARGIN * 2; // content width
  let   y        = 0;

  // ── Colours (no alpha) ────────────────────────────────────
  const C = {
    primary : [108,  85, 224] as [number,number,number],
    text    : [ 20,  18,  40] as [number,number,number],
    muted   : [100,  95, 120] as [number,number,number],
    line    : [220, 218, 235] as [number,number,number],
    green   : [  4, 120,  87] as [number,number,number],
    red     : [204,   0,   0] as [number,number,number],
    amber   : [180,  90,   9] as [number,number,number],
    bg      : [248, 247, 255] as [number,number,number],
    bgred   : [255, 240, 240] as [number,number,number],
    bggreen : [240, 253, 244] as [number,number,number],
    bgamber : [255, 251, 235] as [number,number,number],
    dark    : [ 30,  26,  46] as [number,number,number],
    white   : [255, 255, 255] as [number,number,number],
    purple  : [180, 160, 255] as [number,number,number],
    lavender: [235, 232, 255] as [number,number,number],
  };

  const VARIANT_CLR: Record<string,[number,number,number]> = {
    slay   : [108, 85, 224],
    healing: [  4,120,  87],
    mid    : [180, 90,   9],
    cooked : [204,  0,   0],
  };

  const s       = result.scores;
  const spA     = result.speakers?.a ?? "Person A";
  const spB     = result.speakers?.b ?? "Person B";
  const variant = result.card_variant ?? "mid";
  const accent  = VARIANT_CLR[variant] ?? C.primary;

  // ── Helpers ───────────────────────────────────────────────

  function newPage() {
    doc.addPage();
    y = MARGIN + 4;
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, 9, W - MARGIN, 9);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.muted);
    doc.text("AURAXA  |  AI EMOTIONAL INTELLIGENCE", MARGIN, 7);
    doc.text(`${spA} & ${spB}`, W - MARGIN, 7, { align: "right" });
  }

  function checkY(need: number) {
    if (y + need > 278) newPage();
  }

  function rule(color = C.line) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, W - MARGIN, y);
    y += 5;
  }

  function secTitle(title: string) {
    checkY(14);
    doc.setFillColor(...C.primary);
    doc.roundedRect(MARGIN, y, CW, 8, 1, 1, "F");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text(title.toUpperCase(), MARGIN + 4, y + 5.5);
    y += 13;
  }

  function lbl(text: string, color = C.muted) {
    checkY(6);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(text.toUpperCase(), MARGIN, y);
    y += 4.5;
  }

  function para(text: string, indent = 0) {
    if (!text) return;
    const safe = text.replace(/[^\x20-\x7E\n]/g, ""); // strip non-latin
    if (!safe.trim()) return;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.text);
    const lines = doc.splitTextToSize(safe, CW - indent);
    checkY(lines.length * 4.5 + 2);
    doc.text(lines, MARGIN + indent, y);
    y += lines.length * 4.5 + 2;
  }

  function bar(label: string, pct: number, color: [number,number,number]) {
    checkY(10);
    const safe = Math.min(Math.max(pct, 0), 100);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.text);
    doc.text(label, MARGIN, y + 2.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(`${Math.round(safe)}%`, W - MARGIN, y + 2.5, { align: "right" });
    doc.setFillColor(...C.line);
    doc.roundedRect(MARGIN + 52, y, CW - 60, 3, 1, 1, "F");
    if (safe > 0) {
      doc.setFillColor(...color);
      doc.roundedRect(MARGIN + 52, y, Math.max((safe / 100) * (CW - 60), 1), 3, 1, 1, "F");
    }
    y += 7.5;
  }

  function twoCol(items: { l: string; v: string }[]) {
    const colW = (CW - 4) / 2;
    let col = 0;
    let rowY = y;
    for (const item of items) {
      if (!item.v) continue;
      const x = MARGIN + col * (colW + 4);
      doc.setFillColor(...C.bg);
      doc.roundedRect(x, rowY, colW, 13, 1, 1, "F");
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.muted);
      doc.text(item.l.toUpperCase(), x + 3, rowY + 4.5);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.text);
      const val = doc.splitTextToSize(
        item.v.replace(/[^\x20-\x7E]/g, ""),
        colW - 6,
      );
      doc.text(val[0] ?? "", x + 3, rowY + 10);
      col++;
      if (col === 2) { col = 0; rowY += 16; }
    }
    y = rowY + (col > 0 ? 16 : 2);
  }

  function flagRow(text: string, sub: string, color: [number,number,number], bgColor: [number,number,number], prefix: string) {
    checkY(14);
    const mainLines = doc.splitTextToSize(
      text.replace(/[^\x20-\x7E]/g, ""),
      CW - 10,
    );
    const subLines = sub
      ? doc.splitTextToSize(sub.replace(/[^\x20-\x7E]/g, ""), CW - 14)
      : [];
    const boxH = (mainLines.length + subLines.length) * 4.5 + 8;
    doc.setFillColor(...bgColor);
    doc.roundedRect(MARGIN, y, CW, boxH, 1, 1, "F");
    doc.setDrawColor(...color);
    doc.setLineWidth(1.2);
    doc.line(MARGIN, y + 1, MARGIN, y + boxH - 1);
    doc.setLineWidth(0.3);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(`${prefix} ${mainLines[0] ?? ""}`, MARGIN + 4, y + 5);
    if (mainLines.length > 1) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.text);
      doc.text(mainLines.slice(1), MARGIN + 4, y + 5 + 4.5);
    }
    if (subLines.length) {
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...C.muted);
      doc.text(subLines, MARGIN + 6, y + 5 + mainLines.length * 4.5);
    }
    y += boxH + 4;
  }

  // ═══════════════════════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════════════════════
  y = 0;

  // Accent header band
  doc.setFillColor(...accent);
  doc.rect(0, 0, W, 46, "F");

  // Brand
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text("AURAXA", MARGIN, 14);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("AI EMOTIONAL INTELLIGENCE", MARGIN, 19);

  // Score
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(`${s.overall_score}`, MARGIN, 39);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("/ 100", MARGIN + 20, 39);

  // Names + verdict (right side)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`${spA} & ${spB}`, W - MARGIN, 14, { align: "right" });

  if (result.genz_verdict) {
    const vt = `"${result.genz_verdict}"`.replace(/[^\x20-\x7E]/g, "");
    const vl = doc.splitTextToSize(vt, 85);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(vl, W - MARGIN, 21, { align: "right" });
  }

  y = 55;

  // Score strip
  doc.setFillColor(...C.bg);
  doc.roundedRect(MARGIN, y, CW, 22, 2, 2, "F");
  const strip = [
    { l: "Compatibility", v: `${s.compatibility_score}%`, c: C.primary },
    { l: "Toxicity",      v: String(s.toxicity_level),    c: C.red },
    { l: "Ghosting Risk", v: String(s.ghosting_risk),     c: C.amber },
    { l: "Attachment",    v: String(s.attachment_style ?? "—"), c: C.text },
  ];
  const qW = CW / 4;
  strip.forEach((m, i) => {
    const x = MARGIN + i * qW + qW / 2;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...m.c);
    doc.text(m.v.replace(/[^\x20-\x7E]/g, "-"), x, y + 11, { align: "center" });
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.muted);
    doc.text(m.l.toUpperCase(), x, y + 17, { align: "center" });
  });
  y += 30;

  // Meta line
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.muted);
  if (result.message_count) {
    doc.text(`${result.message_count.toLocaleString()} messages analysed`, MARGIN, y);
  }
  const drRaw = result.date_range;
  const drStr = typeof drRaw === "string"
    ? drRaw
    : drRaw?.start
    ? `${drRaw.start} to ${drRaw.end ?? ""}`
    : "";
  if (drStr) doc.text(drStr.replace(/[^\x20-\x7E]/g, " "), W - MARGIN, y, { align: "right" });
  y += 10;

  rule();

  // ── Honest Truth ─────────────────────────────────────────
  if (result.ai_narrative) {
    secTitle("The Honest Truth");
    para(result.ai_narrative);
    y += 3;
  }

  // ── Hard Truths ───────────────────────────────────────────
  if (result.hard_truths?.length) {
    secTitle("Hard Truths");
    result.hard_truths.forEach((t: string, i: number) => {
      checkY(14);
      const safe  = t.replace(/[^\x20-\x7E]/g, "");
      const lines = doc.splitTextToSize(safe, CW - 12);
      const boxH  = lines.length * 4.5 + 7;
      doc.setFillColor(...C.bgred);
      doc.roundedRect(MARGIN, y, CW, boxH, 1, 1, "F");
      doc.setDrawColor(...C.red);
      doc.setLineWidth(1);
      doc.line(MARGIN, y + 1, MARGIN, y + boxH - 1);
      doc.setLineWidth(0.3);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.red);
      doc.text(`${i + 1}.`, MARGIN + 3, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.text);
      doc.text(lines, MARGIN + 9, y + 5);
      y += boxH + 4;
    });
  }

  // ── Scoring Breakdown ─────────────────────────────────────
  if (result.scoring_breakdown) {
    const sb = result.scoring_breakdown;
    secTitle("Scoring Breakdown");
    if (sb.emotional_health != null) {
      bar("Emotional Health",  sb.emotional_health,  C.primary);
      if (sb.emotional_health_note) para(sb.emotional_health_note);
    }
    if (sb.compatibility != null) {
      bar("Compatibility",     sb.compatibility,     C.green);
      if (sb.compatibility_note) para(sb.compatibility_note);
    }
    if (sb.toxicity_score != null) {
      bar("Toxicity Level",    sb.toxicity_score,    C.red);
      if (sb.toxicity_note) para(sb.toxicity_note);
    }
    if (sb.ghosting_score != null) {
      bar("Ghosting Risk",     sb.ghosting_score,    C.amber);
      if (sb.ghosting_note) para(sb.ghosting_note);
    }
    y += 2;
  }

  // ── Sub-Metrics ───────────────────────────────────────────
  if (result.sub_metrics) {
    const sub = result.sub_metrics;
    secTitle("Sub-Metrics");

    if (sub.initiation_balance) {
      lbl("Initiation Balance");
      bar(spA, sub.initiation_balance.person_a_pct ?? 50, C.primary);
      bar(spB, sub.initiation_balance.person_b_pct ?? 50, [155, 140, 240]);
      if (sub.initiation_balance.note) para(sub.initiation_balance.note);
      y += 3;
    }
    if (sub.response_time_trend) {
      lbl("Response Time Trend");
      const rt = sub.response_time_trend;
      para(`Overall: ${rt.trend}   |   ${spA}: ${rt.person_a_trend ?? "-"}   |   ${spB}: ${rt.person_b_trend ?? "-"}`);
      if (rt.note) para(rt.note);
      y += 3;
    }
    if (sub.sentiment_arc) {
      lbl("Sentiment Arc");
      const sa = sub.sentiment_arc;
      para(`Early: ${sa.early_sentiment}  >  Middle: ${sa.middle_sentiment}  >  Recent: ${sa.recent_sentiment}  (${sa.arc_direction})`);
      if (sa.note) para(sa.note);
      y += 3;
    }
    if (sub.affection_signals) {
      lbl("Affection Signals");
      const af = sub.affection_signals;
      para(`${af.count ?? 0} moments detected   |   Quality: ${af.quality}   |   Mainly from: ${af.who_shows_more}`);
      if (af.examples?.length) para(`Types: ${af.examples.join(", ")}`);
      if (af.note) para(af.note);
    }
  }

  // ── Conversation Phases ───────────────────────────────────
  if (result.conversation_phases?.length) {
    secTitle("Conversation Phases");
    result.conversation_phases.forEach((ph: any) => {
      checkY(22);
      const phC = ph.red_or_green === "red" ? C.red : ph.red_or_green === "green" ? C.green : C.amber;
      const phBg= ph.red_or_green === "red" ? C.bgred : ph.red_or_green === "green" ? C.bggreen : C.bgamber;
      const descLines = ph.description
        ? doc.splitTextToSize(ph.description.replace(/[^\x20-\x7E]/g, ""), CW - 10)
        : [];
      const boxH = descLines.length * 4.5 + 16;
      doc.setFillColor(...phBg);
      doc.roundedRect(MARGIN, y, CW, boxH, 1, 1, "F");
      doc.setDrawColor(...phC);
      doc.setLineWidth(1.5);
      doc.line(MARGIN, y + 1, MARGIN, y + boxH - 1);
      doc.setLineWidth(0.3);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.text);
      const phaseName = `${ph.phase_number}. ${ph.phase_name}`.replace(/[^\x20-\x7E]/g, "");
      doc.text(phaseName, MARGIN + 5, y + 6);
      if (ph.dominant_emotion) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...phC);
        const emoX = MARGIN + 5 + doc.getTextWidth(phaseName) + 3;
        doc.text(`[${ph.dominant_emotion}]`, emoX, y + 6);
      }
      if (descLines.length) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.text);
        doc.text(descLines, MARGIN + 5, y + 12);
      }
      if (ph.shift_trigger) {
        const shiftY = y + 12 + descLines.length * 4.5;
        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...C.muted);
        doc.text(`> Shift: ${ph.shift_trigger.replace(/[^\x20-\x7E]/g, "")}`, MARGIN + 5, shiftY);
      }
      y += boxH + 4;
    });
  }

  // ── Peak Moments ──────────────────────────────────────────
  if (result.peak_moments) {
    const pk = result.peak_moments;
    secTitle("Peak Moments");
    const peaks = [
      { l: "Highest Point",         v: pk.highest_point?.description,  sub: pk.highest_point?.why_it_mattered, c: C.green,   bg: C.bggreen },
      { l: "Lowest Point",          v: pk.lowest_point?.description,   sub: pk.lowest_point?.what_it_revealed, c: C.red,     bg: C.bgred   },
      { l: "Turning Point",         v: pk.turning_point,               sub: null,                              c: C.amber,   bg: C.bgamber },
      { l: "Most Authentic Moment", v: pk.most_authentic_moment,       sub: null,                              c: C.primary, bg: C.lavender},
    ];
    peaks
      .filter(p => p.v && p.v !== "No clear turning point detected")
      .forEach(p => {
        checkY(16);
        const vSafe = p.v!.replace(/[^\x20-\x7E]/g, "");
        const mainL = doc.splitTextToSize(vSafe, CW - 10);
        const subL  = p.sub
          ? doc.splitTextToSize(p.sub.replace(/[^\x20-\x7E]/g, ""), CW - 12)
          : [];
        const boxH = (mainL.length + subL.length) * 4.5 + 11;
        doc.setFillColor(...p.bg);
        doc.roundedRect(MARGIN, y, CW, boxH, 1, 1, "F");
        doc.setDrawColor(...p.c);
        doc.setLineWidth(1.2);
        doc.line(MARGIN, y + 1, MARGIN, y + boxH - 1);
        doc.setLineWidth(0.3);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...p.c);
        doc.text(p.l.toUpperCase(), MARGIN + 5, y + 5);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.text);
        doc.text(mainL, MARGIN + 5, y + 10);
        if (subL.length) {
          doc.setFont("helvetica", "italic");
          doc.setTextColor(...C.muted);
          doc.text(subL, MARGIN + 5, y + 10 + mainL.length * 4.5);
        }
        y += boxH + 4;
      });
  }

  // ── Key Topics ────────────────────────────────────────────
  if (result.key_topics?.length) {
    secTitle("What You Mostly Talk About");
    result.key_topics.forEach((t: any) => {
      checkY(14);
      const sentC = t.sentiment === "positive" ? C.green : t.sentiment === "negative" ? C.red : C.muted;
      const sentBg= t.sentiment === "positive" ? C.bggreen : t.sentiment === "negative" ? C.bgred : C.bg;
      const topicSafe = String(t.topic ?? "").replace(/[^\x20-\x7E]/g, "");
      const descLines = t.description
        ? doc.splitTextToSize(t.description.replace(/[^\x20-\x7E]/g, ""), CW - 8)
        : [];
      const boxH = descLines.length * 4.5 + 13;
      doc.setFillColor(...sentBg);
      doc.roundedRect(MARGIN, y, CW, boxH, 1, 1, "F");
      doc.setFillColor(...sentC);
      doc.circle(MARGIN + 4, y + 5, 2, "F");
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.text);
      doc.text(topicSafe, MARGIN + 9, y + 6.5);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.muted);
      doc.text(
        `${t.sentiment ?? ""} | ${t.frequency ?? ""}`,
        MARGIN + 9 + doc.getTextWidth(topicSafe) + 3,
        y + 6.5,
      );
      if (descLines.length) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.text);
        doc.text(descLines, MARGIN + 5, y + 12);
      }
      y += boxH + 3;
    });
  }

  // ── Red Flags ─────────────────────────────────────────────
  if (result.red_flags?.length) {
    secTitle("Red Flags");
    result.red_flags.forEach((f: any) => {
      const sev = f.severity ? ` [${f.severity}]` : "";
      flagRow(
        `${f.flag}${sev}`,
        f.evidence ?? "",
        C.red, C.bgred, "!",
      );
    });
  }

  // ── Green Flags ───────────────────────────────────────────
  if (result.green_flags?.length) {
    secTitle("Green Flags");
    result.green_flags.forEach((f: any) => {
      flagRow(
        String(f.flag ?? ""),
        f.evidence ?? "",
        C.green, C.bggreen, "+",
      );
    });
  }

  // ── Relationship Health ───────────────────────────────────
  if (result.relationship_health_indicators) {
    const hi = result.relationship_health_indicators;
    secTitle("Relationship Health");
    [
      { l: "Mutual Respect",   v: hi.mutual_respect },
      { l: "Emotional Safety", v: hi.emotional_safety },
      { l: "Authenticity",     v: hi.authenticity },
      { l: "Reciprocity",      v: hi.reciprocity },
      { l: "Growth Potential", v: hi.growth_potential },
    ]
      .filter(i => i.v != null)
      .forEach(i => {
        const c = i.v >= 70 ? C.green : i.v >= 50 ? C.amber : C.red;
        bar(i.l, i.v, c);
      });
    y += 2;
  }

  // ── Communication Breakdown ───────────────────────────────
  if (result.communication_analysis) {
    const comm = result.communication_analysis;
    secTitle("Communication Breakdown");
    twoCol([
      { l: "Who Initiates",  v: String(comm.who_initiates_more ?? "") },
      { l: "Split",          v: String(comm.initiation_percentage ?? "") },
      { l: "Humor Level",    v: String(comm.humor_level ?? "") },
      { l: "Power Dynamic",  v: String(comm.power_dynamic ?? "") },
    ]);
    if (comm.response_style_a) { lbl(`${spA}'s Style`); para(comm.response_style_a); y += 2; }
    if (comm.response_style_b) { lbl(`${spB}'s Style`); para(comm.response_style_b); y += 2; }
    if (comm.conflict_style)   { lbl("Conflict Style");  para(comm.conflict_style);  y += 2; }
    if (comm.affection_shown)  { lbl("Affection Shown"); para(comm.affection_shown); }
  }

  // ── Roast ─────────────────────────────────────────────────
  if (result.roast) {
    const r = result.roast;
    secTitle("The Roast");
    if (r.person_a_roast) {
      lbl(spA, C.primary);
      para(r.person_a_roast);
      y += 3;
    }
    if (r.person_b_roast) {
      lbl(spB, C.green);
      para(r.person_b_roast);
      y += 3;
    }
    if (r.relationship_roast) {
      lbl("The Relationship", C.amber);
      para(r.relationship_roast);
      y += 3;
    }
    if (r.roast_verdict) {
      checkY(16);
      const vt = `"${r.roast_verdict}"`.replace(/[^\x20-\x7E]/g, "");
      const vl  = doc.splitTextToSize(vt, CW - 10);
      const bH  = vl.length * 5 + 8;
      doc.setFillColor(...C.dark);
      doc.roundedRect(MARGIN, y, CW, bH, 2, 2, "F");
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bolditalic");
      doc.setTextColor(...C.white);
      doc.text(vl, W / 2, y + 6, { align: "center" });
      y += bH + 5;
    }
  }

  // ── Astrology ─────────────────────────────────────────────
  if (result.astrology_reading) {
    const a = result.astrology_reading;
    secTitle("What the Stars Say");
    twoCol([
      { l: spA, v: String(a.inferred_sign_a ?? "") },
      { l: spB, v: String(a.inferred_sign_b ?? "") },
    ]);
    if (a.element_dynamic)     { lbl("Element Dynamic");         para(a.element_dynamic);      y += 2; }
    if (a.mercury_reading)     { lbl("Mercury - Communication"); para(a.mercury_reading);      y += 2; }
    if (a.venus_reading)       { lbl("Venus - Love Style");      para(a.venus_reading);        y += 2; }
    if (a.cosmic_compatibility){ lbl("Cosmic Compatibility");    para(a.cosmic_compatibility); y += 2; }
    if (a.saturn_truth)        { lbl("Saturn - The Lesson");     para(a.saturn_truth);         y += 2; }
    if (a.cosmic_verdict) {
      checkY(16);
      const vt = `"${a.cosmic_verdict}"`.replace(/[^\x20-\x7E]/g, "");
      const vl  = doc.splitTextToSize(vt, CW - 10);
      const bH  = vl.length * 5 + 8;
      doc.setFillColor(...C.dark);
      doc.roundedRect(MARGIN, y, CW, bH, 2, 2, "F");
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bolditalic");
      doc.setTextColor(...C.purple);
      doc.text(vl, W / 2, y + 6, { align: "center" });
      y += bH + 5;
    }
  }

  // ── What This Reveals ─────────────────────────────────────
  if (result.what_this_reveals) {
    secTitle("What This Actually Reveals");
    para(result.what_this_reveals);
    y += 3;
  }

  // ── Therapist Note ────────────────────────────────────────
  if (result.therapist_note) {
    secTitle("A Note");
    doc.setFont("helvetica", "italic");
    para(result.therapist_note);
    y += 5;
    checkY(8);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.primary);
    doc.text("You are not overreacting. You are figuring it out.", MARGIN, y);
    y += 8;
  }

  // ── Footer ────────────────────────────────────────────────
  checkY(14);
  rule();
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.muted);
  doc.text("Generated by Auraxa  |  auraxa.app  |  AI-powered emotional intelligence", MARGIN, y);
  doc.text(
    new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    W - MARGIN, y, { align: "right" },
  );
  y += 4;
  doc.text("This report is AI-generated and not a substitute for professional therapy.", MARGIN, y);

  // ── Page numbers ──────────────────────────────────────────
  const total = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text(`${i} / ${total}`, W - MARGIN, 293, { align: "right" });
  }

  // ── Download ──────────────────────────────────────────────
  const fname = `auraxa-${spA}-${spB}-${s.overall_score}.pdf`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");

  doc.save(fname);
}
