"use client";

import { useEffect, useState, useCallback, use, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import GenZCard, { scoreToVariant, scoreToSlang } from "@/components/cards/GenZCard";
import { DownloadReportButton } from "@/components/results/DownloadReportButton";

// ─── Types ────────────────────────────────────────────────
interface Scores {
  overall_score: number;
  compatibility_score: number;
  communication_balance: number;
  speaker_a_percentage: number;
  speaker_b_percentage: number;
  toxicity_level: string;
  ghosting_risk: string;
  attachment_style?: string;
  patterns_detected: string[];
  ai_narrative?: string;
}

interface AnalysisResult {
  id: string;
  status: string;
  speakers?: { a?: string; b?: string };
  scores?: Scores;
  ai_narrative?: string;
  message_count?: number;
  date_range?: any;
  genz_verdict?: string;
  timeline?: any[];
  hard_truths?: string[];
  key_topics?: any[];
  conversation_themes?: any;
  conversation_phases?: any[];
  communication_analysis?: any;
  red_flags?: any[];
  green_flags?: any[];
  emotional_moments?: any;
  relationship_health_indicators?: any;
  roast?: any;
  astrology_reading?: any;
  what_this_reveals?: string;
  therapist_note?: string;
  scoring_breakdown?: any;
  sub_metrics?: any;
  peak_moments?: any;
}

// ─── Helpers ──────────────────────────────────────────────
const SC: Record<string, string> = {
  low: "var(--green)",
  medium: "var(--amber)",
  high: "var(--red)",
  critical: "var(--red)",
};

const SENT_C: Record<string, string> = {
  positive: "var(--green)",
  negative: "var(--red)",
  neutral: "var(--muted)",
  mixed: "var(--amber)",
};

const PHASE_C: Record<string, string> = {
  red: "var(--red)",
  green: "var(--green)",
  neutral: "var(--amber)",
};

function scoreLabel(n: number) {
  if (n >= 80) return { t: "Excellent", c: "var(--green)" };
  if (n >= 65) return { t: "Good", c: "var(--green)" };
  if (n >= 50) return { t: "Moderate", c: "var(--amber)" };
  if (n >= 35) return { t: "Low", c: "var(--amber)" };
  return { t: "Critical", c: "var(--red)" };
}

function formatDateRange(dr: any): string | null {
  if (!dr) return null;
  if (typeof dr === "string") return dr;
  const s = dr.start ?? "";
  const e = dr.end ?? "";
  return s && e ? `${s} — ${e}` : s || e || null;
}

function toxicityInfo(l: string) {
  const m: Record<string, any> = {
    low:      { label: "Low Toxicity",    genZ: "bestie you're safe here fr" },
    medium:   { label: "Some Toxicity",   genZ: "a few icks are showing ngl" },
    high:     { label: "High Toxicity",   genZ: "bestie the ick is LOUD in this one" },
    critical: { label: "Critical",        genZ: "run bestie this is your sign fr fr" },
  };
  return m[l] ?? m.low;
}

function ghostingInfo(r: string) {
  const m: Record<string, any> = {
    low:    { label: "Staying Power",    genZ: "they're not going anywhere bestie" },
    medium: { label: "Watch Closely",    genZ: "lowkey hot and cold energy detected" },
    high:   { label: "Ghost Risk Alert", genZ: "left on read incoming bestie" },
  };
  return m[r] ?? m.low;
}

function attachmentInfo(s?: string) {
  const m: Record<string, any> = {
    secure:       { explain: "Secure attachment — both feel safe expressing needs.",           tip: "Maintain this — it's the foundation for genuine intimacy." },
    anxious:      { explain: "Anxious attachment — over-texting, reassurance-seeking.",        tip: "Practice self-soothing before responding." },
    avoidant:     { explain: "Avoidant patterns — emotional distance, discomfort with vulnerability.", tip: "Small consistent acts of openness build trust over time." },
    disorganized: { explain: "Disorganized attachment — push-pull dynamic.",                   tip: "This often traces to early experiences. Consider therapy." },
  };
  return m[s ?? "secure"] ?? m.secure;
}

const VARIANT_CONFIG: Record<string, { label: string; color: string }> = {
  slay:    { label: "Slay Era",     color: "#6c55e0" },
  healing: { label: "Healing Arc",  color: "#047857" },
  mid:     { label: "Mid Energy",   color: "#b45309" },
  cooked:  { label: "Cooked",       color: "#cc0000" },
};

// ─── Sub-components ───────────────────────────────────────

function StatusDot({ level }: { level: string }) {
  const c = SC[level] ?? "var(--muted)";
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
      style={{ background: `${c}18`, border: `1.5px solid ${c}` }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: c }} />
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const size = 140;
  const r = size * 0.41;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--surface-alt)" strokeWidth="10"
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--primary)" strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold" style={{ fontSize: size * 0.225, color: "var(--text)", lineHeight: 1 }}>
          {score}
        </span>
        <span className="label" style={{ fontSize: size * 0.07 }}>/ 100</span>
      </div>
    </div>
  );
}

function MetricBar({ label, value, color, delay = 0 }: { label: string; value: number; color: string; delay?: number }) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="label" style={{ fontSize: "9px" }}>{label}</span>
        <span className="font-display font-bold text-xs" style={{ color }}>{Math.round(clamped)}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-alt)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

function Section({
  title, icon, iconColor = "var(--primary)", accent = false, children,
}: {
  title: string; icon: string; iconColor?: string; accent?: boolean; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="card overflow-hidden mb-4"
    >
      <div
        className="px-4 sm:px-6 py-3 flex items-center gap-2.5"
        style={{ borderBottom: "1px solid var(--line)", background: accent ? "var(--pri-soft)" : "var(--surface)" }}
      >
        <span style={{ fontSize: "16px" }}>{icon}</span>
        <h2 className="font-display font-bold text-sm sm:text-base" style={{ color: "var(--text)" }}>{title}</h2>
      </div>
      <div className="px-4 sm:px-6 py-4 sm:py-5">{children}</div>
    </motion.div>
  );
}

function ScoreCard({ result }: { result: AnalysisResult }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const s = result.scores!;
  const variant = scoreToVariant(s.overall_score);
  const verdict = result.genz_verdict ?? scoreToSlang(s.overall_score, s.ghosting_risk, s.toxicity_level);

  const bgMap: Record<string, string> = { slay: "#f8f7ff", healing: "#f0fdf4", mid: "#fff8ee", cooked: "#fff5f5" };
  const clrMap: Record<string, string> = { slay: "#6c55e0", healing: "#047857", mid: "#b45309", cooked: "#cc0000" };
  const bg = bgMap[variant] ?? "#f8f7ff";
  const clr = clrMap[variant] ?? "#6c55e0";

  const download = async () => {
    setDownloading(true);
    try {
      const h2c = (await import("html2canvas")).default;
      const canvas = await h2c(cardRef.current!, { scale: 3, backgroundColor: bg, useCORS: true, logging: false } as any);
      const a = document.createElement("a");
      a.download = `auraxa-${s.overall_score}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      toast.success("Saved!");
    } catch {
      toast.error("Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  const share = async () => {
    const text = `Auraxa Score: ${s.overall_score}/100 — "${verdict}" — auraxa.app`;
    try {
      if (navigator.share) {
        await navigator.share({ text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Copied!");
      }
    } catch { /* user cancelled */ }
  };

  const metrics = [
    { l: "Compatibility", v: `${s.compatibility_score}%` },
    { l: "Toxicity",      v: s.toxicity_level },
    { l: "Ghost Risk",    v: s.ghosting_risk },
    { l: "Attachment",    v: s.attachment_style ?? "—" },
  ];

  return (
    <div>
      <div
        ref={cardRef}
        style={{
          background: bg, border: "1px solid rgba(0,0,0,.08)", borderRadius: "10px",
          padding: "24px", maxWidth: "320px", fontFamily: "'Inter',sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "10px", fontWeight: 800, letterSpacing: "0.2em", color: "rgba(0,0,0,.2)", textTransform: "uppercase" }}>
            AURAXA
          </div>
          <div style={{ fontSize: "9px", color: "rgba(0,0,0,.28)", fontFamily: "'Montserrat',sans-serif", fontWeight: 600, letterSpacing: "0.06em" }}>
            {(result.speakers?.a ?? "You").toUpperCase()} x {(result.speakers?.b ?? "Them").toUpperCase()}
          </div>
        </div>
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "76px", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em", color: clr, marginBottom: "6px" }}>
          {s.overall_score}
        </div>
        <div style={{ fontSize: "13px", lineHeight: 1.4, color: "rgba(0,0,0,.65)", marginBottom: "18px" }}>
          {verdict}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "16px" }}>
          {metrics.map((m) => (
            <div key={m.l} style={{ background: "rgba(0,0,0,.04)", borderRadius: "5px", padding: "7px 9px" }}>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "7px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(0,0,0,.32)", marginBottom: "2px" }}>
                {m.l}
              </div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "12px", fontWeight: 700, color: clr, textTransform: "capitalize" }}>
                {m.v}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "7px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", paddingTop: "10px", borderTop: "1px solid rgba(0,0,0,.08)", color: "rgba(0,0,0,.2)", display: "flex", justifyContent: "space-between" }}>
          <span>auraxa.app</span>
          <span>no cap, all data</span>
        </div>
      </div>
      <div className="flex gap-2 mt-3" style={{ maxWidth: "320px" }}>
        <button
          onClick={download}
          disabled={downloading}
          className="btn btn-primary flex-1"
          style={{ fontSize: "11px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          {downloading
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : "Save Card"}
        </button>
        <button
          onClick={share}
          className="btn btn-secondary"
          style={{ fontSize: "11px", padding: "10px 14px" }}
        >
          Share
        </button>
      </div>
    </div>
  );
}

function TimelineChart({ points, speakerA, speakerB }: { points: any[]; speakerA: string; speakerB: string }) {
  if (!points?.length) return null;
  const max = Math.max(...points.map((p) => p.emotional_intensity), 1);

  const sentColor = (s: string) => {
    if (s === "positive") return "#047857";
    if (s === "negative") return "#cc0000";
    return "#5c5e62";
  };

  return (
    <div>
      <div className="flex items-end gap-0.5 h-24 sm:h-32">
        {points.map((p, i) => {
          const h = Math.max((p.emotional_intensity / max) * 100, 5);
          return (
            <motion.div
              key={i}
              className="flex-shrink-0 rounded-t cursor-pointer relative group"
              style={{
                width: `${Math.max(100 / points.length, 1.5)}%`,
                minWidth: "6px",
                height: `${h}%`,
                background: sentColor(p.sentiment),
                opacity: p.speaker === "a" ? 1 : 0.55,
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.02, duration: 0.3 }}
            >
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 card px-2 py-1 text-center"
                style={{ minWidth: "80px", fontSize: "9px" }}
              >
                <p style={{ color: "var(--text)", fontWeight: "bold" }}>
                  {p.speaker === "a" ? speakerA : speakerB}
                </p>
                <p style={{ color: sentColor(p.sentiment), textTransform: "capitalize" }}>
                  {p.sentiment}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {[{ c: "#047857", l: "Positive" }, { c: "#cc0000", l: "Negative" }, { c: "#5c5e62", l: "Neutral" }].map((x) => (
          <div key={x.l} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: x.c }} />
            <span className="label" style={{ fontSize: "9px" }}>{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Loading steps ────────────────────────────────────────
function ProcessingView({ pollCount }: { pollCount: number }) {
  const STEPS = [
    "Extracting text",
    "Structuring messages",
    "Running AI analysis",
    "Calculating sub-metrics",
    "Finding phases and peaks",
    "Writing hard truths",
    "Consulting the cosmos",
  ];
  const step = Math.min(pollCount, STEPS.length - 1);

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-6">
      <div className="text-center max-w-sm w-full">
        <div className="mb-8 space-y-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: i <= step ? "var(--primary)" : "var(--surface-alt)", transition: "background .4s" }}
              >
                {i <= step && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </div>
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-alt)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "var(--primary)" }}
                  initial={{ width: 0 }}
                  animate={{ width: i <= step ? "100%" : "0%" }}
                  transition={{ duration: 3, ease: "linear" }}
                />
              </div>
              <p className="text-xs font-display font-bold" style={{ color: i <= step ? "var(--text)" : "var(--muted)", minWidth: "160px", textAlign: "left" }}>
                {s}
              </p>
            </div>
          ))}
        </div>
        <p className="label text-center" style={{ fontSize: "10px" }}>
          Reading the unsaid... (~30-60 seconds)
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);

const load = useCallback(async () => {
  try {
    const sr = await api.get(`/api/analyze/${id}/status`);
    const status = sr.data?.status;

    if (status === "completed") {
      const r = await api.get(`/api/analyze/${id}/results`);
      setResult({ ...r.data, status: "completed" });
    } else if (status === "failed") {
      setResult({ id, status: "failed" } as any);
    } else {
      setResult((prev) => prev ? { ...prev, status } : { id, status } as any);
      setPollCount((c) => c + 1);
      setTimeout(load, 3000);
    }
  } catch (e: any) {
    // 404 = analysis deleted or never existed — stop polling immediately
    if (e?.response?.status === 404) {
      setResult({ id, status: "failed" } as any);
    } else if (pollCount < 30) {
      setTimeout(load, 4000);
    }
  } finally {
    setLoading(false);
  }
}, [id, pollCount]);

  useEffect(() => { load(); }, []);

  if (loading && !result) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-12 h-12 rounded-full border-2 animate-spin" style={{ borderColor: "var(--line-2)", borderTopColor: "var(--primary)" }} />
      </div>
    );
  }

  const isProcessing = result && result.status !== "completed" && result.status !== "failed";
  if (isProcessing) return <ProcessingView pollCount={pollCount} />;

  if (result?.status === "failed") {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-6">
        <div className="card p-10 text-center max-w-sm">
          <h3 className="font-display text-lg font-bold mt-4 mb-2" style={{ color: "var(--text)" }}>Analysis Failed</h3>
          <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>Something went wrong. Try again or paste the text directly.</p>
          <Link href="/analyze" className="btn btn-primary">Try Again</Link>
        </div>
      </div>
    );
  }

  const s = result?.scores;
  if (!s) return null;

  const speakerA = result?.speakers?.a ?? "You";
  const speakerB = result?.speakers?.b ?? "Them";
  const variant = scoreToVariant(s.overall_score);
  const verdict = result?.genz_verdict ?? scoreToSlang(s.overall_score, s.ghosting_risk, s.toxicity_level);
  const oLabel = scoreLabel(s.overall_score);
  const tInfo = toxicityInfo(s.toxicity_level);
  const gInfo = ghostingInfo(s.ghosting_risk);
  const aInfo = attachmentInfo(s.attachment_style);
  const vc = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.mid;
  const dateStr = formatDateRange(result?.date_range);

  const sub = result?.sub_metrics;
  const sb = result?.scoring_breakdown;
  const peaks = result?.peak_moments;
  const phases = result?.conversation_phases ?? [];
  const topics = result?.key_topics ?? [];
  const comm = result?.communication_analysis;
  const redFlags = result?.red_flags ?? [];
  const greenFlags = result?.green_flags ?? [];
  const hi = result?.relationship_health_indicators;
  const roast = result?.roast;
  const astro = result?.astrology_reading;
  const hardTruths = result?.hard_truths ?? [];

  const toxPct = s.toxicity_level === "low" ? 20 : s.toxicity_level === "medium" ? 50 : s.toxicity_level === "high" ? 80 : 95;
  const ghostPct = s.ghosting_risk === "low" ? 15 : s.ghosting_risk === "medium" ? 55 : 90;

  return (
    <div className="px-3 sm:px-5 md:px-8 py-4 md:py-8 max-w-2xl">

      {/* Nav */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <Link href="/reports" className="inline-flex items-center gap-1.5 label hover:text-primary transition-colors" style={{ fontSize: "9px" }}>
          Back to Reports
        </Link>
        <Link href={`/advisor/${id}`} className="btn btn-secondary inline-flex items-center gap-2" style={{ fontSize: "11px", padding: "8px 16px" }}>
          Ask AI Advisor
        </Link>
        <DownloadReportButton result={result!} />
      </div>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="card mb-4 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <ScoreRing score={s.overall_score} />
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded mb-2" style={{ background: "var(--pri-soft)", border: "1px solid var(--pri-border)" }}>
                <span className="label" style={{ fontSize: "9px", color: "var(--primary)" }}>{vc.label}</span>
              </div>
              <h1 className="font-display font-bold mb-1" style={{ fontSize: "clamp(1.3rem,5vw,1.75rem)", color: "var(--text)", lineHeight: 1.1 }}>
                {speakerA} &amp; {speakerB}
              </h1>
              <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--muted)", fontStyle: "italic" }}>{verdict}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-display font-bold text-sm" style={{ color: oLabel.c }}>{oLabel.t}</span>
                {result?.message_count && <span className="label" style={{ fontSize: "9px" }}>{result.message_count} messages</span>}
                {dateStr && <span className="label" style={{ fontSize: "9px" }}>{dateStr}</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4" style={{ borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
          {[
            { l: "Compat",   v: `${s.compatibility_score}%`, c: "var(--primary)" },
            { l: "Toxicity", v: s.toxicity_level,            c: SC[s.toxicity_level] ?? "var(--muted)" },
            { l: "Ghosting", v: s.ghosting_risk,             c: SC[s.ghosting_risk] ?? "var(--muted)" },
            { l: "Style",    v: s.attachment_style ?? "—",   c: "var(--text)" },
          ].map((m) => (
            <div key={m.l} className="text-center py-3 px-2" style={{ borderRight: "1px solid var(--line)" }}>
              <p className="font-display font-bold capitalize" style={{ fontSize: "clamp(11px,3vw,14px)", color: m.c }}>{m.v}</p>
              <p className="label mt-0.5" style={{ fontSize: "8px" }}>{m.l}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Score Card */}
      <Section title="Your Score Card" icon="🎴">
        <ScoreCard result={result!} />
      </Section>

      {/* Scoring Breakdown */}
      {sb && (
        <Section title="Scoring Breakdown" icon="📊">
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>The four core dimensions scored independently.</p>
          <div className="space-y-4">
            {[
              { l: "Emotional Health",  v: sb.emotional_health,  note: sb.emotional_health_note, c: "var(--primary)" },
              { l: "Compatibility",     v: sb.compatibility,     note: sb.compatibility_note,    c: "var(--green)" },
              { l: "Toxicity Level",    v: sb.toxicity_score,    note: sb.toxicity_note,         c: "var(--red)" },
              { l: "Ghosting Risk",     v: sb.ghosting_score,    note: sb.ghosting_note,         c: "var(--amber)" },
            ].filter((i) => i.v != null).map((i, idx) => (
              <div key={i.l}>
                <MetricBar label={i.l} value={i.v} color={i.c} delay={idx * 0.1} />
                {i.note && <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>{i.note}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Sub Metrics */}
      {sub && (
        <Section title="Sub-Metrics" icon="📈">
          <div className="space-y-5">

            {/* Initiation Balance */}
            {sub.initiation_balance && (
              <div>
                <p className="label mb-2" style={{ fontSize: "9px" }}>INITIATION BALANCE</p>
                <div className="space-y-2 mb-2">
                  <MetricBar label={speakerA} value={sub.initiation_balance.person_a_pct ?? 50} color="var(--primary)" />
                  <MetricBar label={speakerB} value={sub.initiation_balance.person_b_pct ?? 50} color="#9b8cf0" delay={0.1} />
                </div>
                {sub.initiation_balance.note && (
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{sub.initiation_balance.note}</p>
                )}
              </div>
            )}

            {/* Response Time Trend */}
            {sub.response_time_trend && (
              <div className="p-3 rounded" style={{ background: "var(--surface-alt)" }}>
                <p className="label mb-2" style={{ fontSize: "9px" }}>RESPONSE TIME TREND</p>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2.5 py-1 rounded font-display font-bold capitalize"
                    style={{
                      fontSize: "11px",
                      background: sub.response_time_trend.trend === "improving" ? "var(--green)" : sub.response_time_trend.trend === "declining" ? "var(--red)" : "var(--amber)",
                      color: "#fff",
                    }}
                  >
                    {sub.response_time_trend.trend}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {sub.response_time_trend.person_a_trend && (
                    <div className="p-2 rounded" style={{ background: "var(--bg)" }}>
                      <p className="label" style={{ fontSize: "8px" }}>{speakerA.toUpperCase()}</p>
                      <p className="text-xs capitalize" style={{ color: "var(--text)" }}>{sub.response_time_trend.person_a_trend}</p>
                    </div>
                  )}
                  {sub.response_time_trend.person_b_trend && (
                    <div className="p-2 rounded" style={{ background: "var(--bg)" }}>
                      <p className="label" style={{ fontSize: "8px" }}>{speakerB.toUpperCase()}</p>
                      <p className="text-xs capitalize" style={{ color: "var(--text)" }}>{sub.response_time_trend.person_b_trend}</p>
                    </div>
                  )}
                </div>
                {sub.response_time_trend.note && (
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{sub.response_time_trend.note}</p>
                )}
              </div>
            )}

            {/* Sentiment Arc */}
            {sub.sentiment_arc && (
              <div>
                <p className="label mb-2" style={{ fontSize: "9px" }}>SENTIMENT ARC</p>
                <div className="flex items-stretch gap-2 mb-2">
                  {[
                    { l: "Early",  v: sub.sentiment_arc.early_sentiment },
                    { l: "Middle", v: sub.sentiment_arc.middle_sentiment },
                    { l: "Recent", v: sub.sentiment_arc.recent_sentiment },
                  ].map((a) => (
                    <div
                      key={a.l}
                      className="flex-1 p-2.5 rounded text-center"
                      style={{
                        background: `${SENT_C[a.v] ?? "var(--muted)"}15`,
                        border: `1px solid ${SENT_C[a.v] ?? "var(--line)"}40`,
                      }}
                    >
                      <p className="label mb-0.5" style={{ fontSize: "8px" }}>{a.l}</p>
                      <p className="font-display font-bold text-xs capitalize" style={{ color: SENT_C[a.v] ?? "var(--muted)" }}>{a.v}</p>
                    </div>
                  ))}
                </div>
                {sub.sentiment_arc.arc_direction && (
                  <p
                    className="text-xs font-bold capitalize mb-1"
                    style={{ color: sub.sentiment_arc.arc_direction === "improving" ? "var(--green)" : sub.sentiment_arc.arc_direction === "declining" ? "var(--red)" : "var(--amber)" }}
                  >
                    Arc: {sub.sentiment_arc.arc_direction}
                  </p>
                )}
                {sub.sentiment_arc.note && (
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{sub.sentiment_arc.note}</p>
                )}
              </div>
            )}

            {/* Affection Signals */}
            {sub.affection_signals && (
              <div className="p-3 rounded" style={{ background: "var(--surface-alt)" }}>
                <p className="label mb-2" style={{ fontSize: "9px" }}>AFFECTION SIGNALS</p>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded flex items-center justify-center" style={{ background: "var(--pri-soft)" }}>
                    <span className="font-display font-bold text-xl" style={{ color: "var(--primary)" }}>
                      {sub.affection_signals.count ?? 0}
                    </span>
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm" style={{ color: "var(--text)" }}>Affectionate moments</p>
                    <p className="label" style={{ fontSize: "9px" }}>
                      Quality: <span className="capitalize">{sub.affection_signals.quality}</span> — mainly from {sub.affection_signals.who_shows_more}
                    </p>
                  </div>
                </div>
                {sub.affection_signals.examples?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {sub.affection_signals.examples.map((e: string) => (
                      <span key={e} className="px-2 py-0.5 rounded text-xs" style={{ background: "var(--bg)", color: "var(--text)" }}>{e}</span>
                    ))}
                  </div>
                )}
                {sub.affection_signals.note && (
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{sub.affection_signals.note}</p>
                )}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Honest Truth */}
      {result?.ai_narrative && (
        <Section title="The Honest Truth" icon="📖">
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)", whiteSpace: "pre-line" }}>{result.ai_narrative}</p>
        </Section>
      )}

      {/* Hard Truths */}
      {hardTruths.length > 0 && (
        <Section title="Hard Truths" icon="🔥">
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Things you need to hear even if you don&apos;t want to.</p>
          <div className="space-y-3">
            {hardTruths.map((t: string, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex gap-3 p-3 rounded"
                style={{ background: "rgba(204,0,0,.06)", border: "1px solid rgba(204,0,0,.15)" }}
              >
                <span className="font-display font-bold text-sm flex-shrink-0" style={{ color: "var(--red)" }}>{i + 1}.</span>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{t}</p>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Conversation Phases */}
      {phases.length > 0 && (
        <Section title="How This Evolved" icon="📉">
          <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Major phases and turning points.</p>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: "var(--line)" }} />
            <div className="space-y-5">
              {phases.map((ph: any, i: number) => {
                const phColor = PHASE_C[ph.red_or_green] ?? "var(--primary)";
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4 pl-8 relative"
                  >
                    <div
                      className="absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-xs"
                      style={{ background: `${phColor}18`, border: `2px solid ${phColor}`, color: phColor, zIndex: 1 }}
                    >
                      {ph.phase_number}
                    </div>
                    <div className="flex-1 card p-4" style={{ borderLeft: `3px solid ${phColor}` }}>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="font-display font-bold text-sm" style={{ color: "var(--text)" }}>{ph.phase_name}</p>
                        {ph.dominant_emotion && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono capitalize" style={{ background: `${phColor}18`, color: phColor }}>
                            {ph.dominant_emotion}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--muted)" }}>{ph.description}</p>
                      {ph.shift_trigger && (
                        <p className="text-[10px] italic" style={{ color: "var(--muted-2)" }}>Shift: {ph.shift_trigger}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Section>
      )}

      {/* Peak Moments */}
      {peaks && (
        <Section title="Peak Moments" icon="✨">
          <div className="space-y-3">
            {peaks.highest_point?.description && (
              <div className="p-3 rounded" style={{ background: "var(--surface-alt)", borderLeft: "3px solid var(--green)" }}>
                <p className="label mb-1" style={{ fontSize: "9px", color: "var(--green)" }}>HIGHEST POINT</p>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--text)" }}>{peaks.highest_point.description}</p>
                {peaks.highest_point.why_it_mattered && (
                  <p className="text-xs italic" style={{ color: "var(--muted)" }}>{peaks.highest_point.why_it_mattered}</p>
                )}
              </div>
            )}
            {peaks.lowest_point?.description && (
              <div className="p-3 rounded" style={{ background: "var(--surface-alt)", borderLeft: "3px solid var(--red)" }}>
                <p className="label mb-1" style={{ fontSize: "9px", color: "var(--red)" }}>LOWEST POINT</p>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--text)" }}>{peaks.lowest_point.description}</p>
                {peaks.lowest_point.what_it_revealed && (
                  <p className="text-xs italic" style={{ color: "var(--muted)" }}>{peaks.lowest_point.what_it_revealed}</p>
                )}
              </div>
            )}
            {peaks.turning_point && peaks.turning_point !== "No clear turning point detected" && (
              <div className="p-3 rounded" style={{ background: "var(--surface-alt)", borderLeft: "3px solid var(--amber)" }}>
                <p className="label mb-1" style={{ fontSize: "9px", color: "var(--amber)" }}>TURNING POINT</p>
                <p className="text-xs" style={{ color: "var(--text)" }}>{peaks.turning_point}</p>
              </div>
            )}
            {peaks.most_authentic_moment && (
              <div className="p-3 rounded" style={{ background: "var(--pri-soft)", border: "1px solid var(--pri-border)" }}>
                <p className="label mb-1" style={{ fontSize: "9px", color: "var(--primary)" }}>MOST AUTHENTIC MOMENT</p>
                <p className="text-xs" style={{ color: "var(--text)" }}>{peaks.most_authentic_moment}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Key Topics */}
      {topics.length > 0 && (
        <Section title="What You Mostly Talk About" icon="💬">
          <div className="space-y-3">
            {topics.map((t: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 p-3 rounded"
                style={{ background: "var(--surface-alt)" }}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: SENT_C[t.sentiment] ?? "var(--primary)" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-display font-bold text-sm" style={{ color: "var(--text)" }}>{t.topic}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono capitalize" style={{ background: `${SENT_C[t.sentiment] ?? "var(--muted)"}18`, color: SENT_C[t.sentiment] ?? "var(--muted)" }}>
                      {t.sentiment}
                    </span>
                    <span className="label" style={{ fontSize: "8px" }}>{t.frequency}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{t.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Roast */}
      {roast && (
        <Section title="The Roast" icon="🔥">
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Brutal honesty wrapped in love.</p>
          <div className="space-y-3 mb-4">
            {[
              { l: speakerA,         v: roast.person_a_roast,     c: "var(--primary)" },
              { l: speakerB,         v: roast.person_b_roast,     c: "var(--green)" },
              { l: "The Relationship", v: roast.relationship_roast, c: "var(--amber)" },
            ].filter((r) => r.v).map((r) => (
              <div key={r.l} className="p-4 rounded" style={{ background: "var(--surface-alt)" }}>
                <p className="label mb-2" style={{ fontSize: "9px", color: r.c }}>{r.l.toUpperCase()}</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{r.v}</p>
              </div>
            ))}
          </div>
          {roast.roast_verdict && (
            <div className="p-4 rounded text-center" style={{ background: "#1e1a2e", border: "1px solid #6c55e0" }}>
              <p className="text-sm font-display font-bold italic" style={{ color: "#fff" }}>
                &quot;{roast.roast_verdict}&quot;
              </p>
            </div>
          )}
        </Section>
      )}

      {/* Astrology */}
      {astro && (
        <Section title="What the Stars Say" icon="🔮">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[{ l: speakerA, v: astro.inferred_sign_a }, { l: speakerB, v: astro.inferred_sign_b }].filter((p) => p.v).map((p) => (
              <div key={p.l} className="p-3 rounded text-center" style={{ background: "linear-gradient(135deg,var(--pri-soft),var(--surface))", border: "1px solid var(--pri-border)" }}>
                <p className="label mb-1" style={{ fontSize: "9px", color: "var(--primary)" }}>{p.l.toUpperCase()}</p>
                <p className="font-display font-bold text-sm" style={{ color: "var(--text)" }}>{p.v}</p>
              </div>
            ))}
          </div>
          {astro.element_dynamic && (
            <div className="p-3 rounded mb-3 flex items-start gap-2" style={{ background: "var(--pri-soft)", border: "1px solid var(--pri-border)" }}>
              <span style={{ fontSize: "18px" }}>⚡</span>
              <div>
                <p className="label mb-0.5" style={{ fontSize: "9px", color: "var(--primary)" }}>ELEMENT DYNAMIC</p>
                <p className="text-sm" style={{ color: "var(--text)" }}>{astro.element_dynamic}</p>
              </div>
            </div>
          )}
          <div className="space-y-3 mb-4">
            {[
              { icon: "☿",  label: "Mercury — Communication", v: astro.mercury_reading },
              { icon: "♀",  label: "Venus — Love Style",      v: astro.venus_reading },
              { icon: "⊕",  label: "Cosmic Compatibility",    v: astro.cosmic_compatibility },
              { icon: "♄",  label: "Saturn — The Lesson",     v: astro.saturn_truth },
            ].filter((r) => r.v).map((r) => (
              <div key={r.label} className="p-3 rounded" style={{ background: "var(--surface-alt)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: "14px" }}>{r.icon}</span>
                  <p className="label" style={{ fontSize: "9px", color: "var(--primary)" }}>{r.label.toUpperCase()}</p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>{r.v}</p>
              </div>
            ))}
          </div>
          {astro.cosmic_verdict && (
            <div className="p-4 rounded text-center" style={{ background: "linear-gradient(135deg,#1e1a2e,#2d1b69)", border: "1px solid #6c55e0" }}>
              <p className="label mb-2" style={{ fontSize: "9px", color: "#9b8cf0" }}>THE COSMOS SAY</p>
              <p className="text-sm font-display font-bold italic" style={{ color: "#fff" }}>
                &quot;{astro.cosmic_verdict}&quot;
              </p>
            </div>
          )}
        </Section>
      )}

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <Section title="Red Flags" icon="🚩">
          <div className="space-y-3">
            {redFlags.map((f: any, i: number) => (
              <div key={i} className="p-3 rounded" style={{ background: "var(--red-soft)", border: "1px solid rgba(204,0,0,.15)" }}>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-display font-bold text-xs" style={{ color: "var(--red)" }}>{f.flag}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono capitalize" style={{ background: "rgba(204,0,0,.1)", color: "var(--red)" }}>
                    {f.severity}
                  </span>
                </div>
                {f.evidence && <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{f.evidence}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Green Flags */}
      {greenFlags.length > 0 && (
        <Section title="Green Flags" icon="✅">
          <div className="space-y-2">
            {greenFlags.map((f: any, i: number) => (
              <div key={i} className="p-3 rounded" style={{ background: "var(--green-soft)", border: "1px solid rgba(4,120,87,.2)" }}>
                <p className="font-display font-bold text-xs mb-0.5" style={{ color: "var(--green)" }}>{f.flag}</p>
                {f.evidence && <p className="text-xs" style={{ color: "var(--muted)" }}>{f.evidence}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Relationship Health */}
      {hi && (
        <Section title="Relationship Health" icon="💜">
          <div className="space-y-4">
            {[
              { l: "Mutual Respect",   v: hi.mutual_respect },
              { l: "Emotional Safety", v: hi.emotional_safety },
              { l: "Authenticity",     v: hi.authenticity },
              { l: "Reciprocity",      v: hi.reciprocity },
              { l: "Growth Potential", v: hi.growth_potential },
            ].filter((i) => i.v != null).map((i, idx) => {
              const c = i.v >= 70 ? "var(--green)" : i.v >= 50 ? "var(--amber)" : "var(--red)";
              return <MetricBar key={i.l} label={i.l} value={i.v} color={c} delay={idx * 0.08} />;
            })}
          </div>
        </Section>
      )}

      {/* Communication */}
      {comm && (
        <Section title="Communication Breakdown" icon="💬">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { l: "Who Initiates",   v: comm.who_initiates_more },
              { l: "Split",           v: comm.initiation_percentage },
              { l: "Humor Level",     v: comm.humor_level },
              { l: "Power Dynamic",   v: comm.power_dynamic },
            ].filter((i) => i.v).map((i) => (
              <div key={i.l} className="p-3 rounded" style={{ background: "var(--surface-alt)" }}>
                <p className="label mb-1" style={{ fontSize: "9px" }}>{i.l.toUpperCase()}</p>
                <p className="text-xs font-bold capitalize" style={{ color: "var(--text)" }}>{i.v}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[
              { l: `${speakerA}'s Style`, v: comm.response_style_a },
              { l: `${speakerB}'s Style`, v: comm.response_style_b },
              { l: "Conflict Style",      v: comm.conflict_style },
              { l: "Affection Shown",     v: comm.affection_shown },
            ].filter((i) => i.v).map((i) => (
              <div key={i.l} className="p-3 rounded" style={{ background: "var(--surface-alt)" }}>
                <p className="label mb-1" style={{ fontSize: "9px" }}>{i.l.toUpperCase()}</p>
                <p className="text-xs" style={{ color: "var(--text)" }}>{i.v}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Toxicity */}
      <Section title="Toxicity Analysis" icon="⚠️">
        <div className="flex items-start gap-3 mb-4">
          <StatusDot level={s.toxicity_level} />
          <div>
            <p className="font-display font-bold text-sm mb-0.5" style={{ color: SC[s.toxicity_level] ?? "var(--muted)" }}>{tInfo.label}</p>
            <p className="text-xs italic mb-2" style={{ color: "var(--primary)" }}>&quot;{tInfo.genZ}&quot;</p>
          </div>
        </div>
        <MetricBar label="Toxicity Level" value={toxPct} color={SC[s.toxicity_level] ?? "var(--muted)"} delay={0.2} />
      </Section>

      {/* Ghosting */}
      <Section title="Ghosting Risk" icon="👻">
        <div className="flex items-start gap-3 mb-4">
          <StatusDot level={s.ghosting_risk} />
          <div>
            <p className="font-display font-bold text-sm mb-0.5" style={{ color: SC[s.ghosting_risk] ?? "var(--muted)" }}>{gInfo.label}</p>
            <p className="text-xs italic mb-2" style={{ color: "var(--primary)" }}>&quot;{gInfo.genZ}&quot;</p>
          </div>
        </div>
        <MetricBar label="Ghosting Risk" value={ghostPct} color={SC[s.ghosting_risk] ?? "var(--muted)"} delay={0.1} />
      </Section>

      {/* Attachment */}
      <Section title="Attachment Style" icon="🔗">
        <p className="font-display font-bold capitalize mb-2" style={{ color: "var(--text)" }}>
          {s.attachment_style ?? "Secure"} Attachment
        </p>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>{aInfo.explain}</p>
        <div className="p-3 rounded" style={{ background: "var(--pri-soft)", border: "1px solid var(--pri-border)" }}>
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{aInfo.tip}</p>
        </div>
      </Section>

      {/* Timeline */}
      {result?.timeline && result.timeline.length > 0 && (
        <Section title="Emotional Timeline" icon="📊">
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
            Each bar = one message. Height = emotional intensity. Hover for details.
          </p>
          <TimelineChart points={result.timeline} speakerA={speakerA} speakerB={speakerB} />
        </Section>
      )}

      {/* What this reveals */}
      {result?.what_this_reveals && (
        <Section title="What This Actually Reveals" icon="👁️">
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{result.what_this_reveals}</p>
        </Section>
      )}

      {/* Therapist note */}
      {result?.therapist_note && (
        <Section title="A Note" icon="🧠">
          <p className="text-sm leading-relaxed italic mb-3" style={{ color: "var(--muted)" }}>{result.therapist_note}</p>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            You are not overreacting. You are figuring it out.
          </p>
        </Section>
      )}

      <div className="text-center py-6">
        <p className="text-xs" style={{ color: "var(--muted)" }}>Built by Aditya · AI-powered · Not a substitute for professional therapy.</p>
      </div>

    </div>
  );
}
