"use client";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";

type InputType = "text" | "screenshot";
type Intent = "conversation" | "pattern" | "style";

const SCORE_DIMENSIONS = [
  { icon: "💜", label: "Emotional Health", range: "0–100", color: "#6c55e0", desc: "Overall emotional quality of the connection" },
  { icon: "🔗", label: "Compatibility Score", range: "0–100", color: "#047857", desc: "How well your communication styles align" },
  { icon: "👻", label: "Ghosting Risk", range: "Low–High", color: "#b45309", desc: "Probability of emotional withdrawal or disappearing" },
  { icon: "⚠️", label: "Toxicity Level", range: "None–Critical", color: "#cc0000", desc: "Presence of harmful communication patterns" },
];

const SUB_METRICS = [
  { icon: "⚖️", label: "Initiation Balance", desc: "Who starts conversations more — and what that reveals" },
  { icon: "⏱️", label: "Response Time Trend", desc: "Is engagement improving, declining, or erratic over time?" },
  { icon: "🌊", label: "Sentiment Arc", desc: "How emotional tone shifted: early vs middle vs recent" },
  { icon: "💌", label: "Affection Signal Count", desc: "How often genuine warmth actually appears — and who shows it" },
];

const REPORT_SECTIONS = [
  "Conversation phases & turning points",
  "Peak moments (best + worst + most authentic)",
  "What you mostly talk about (topics + sentiment)",
  "Red flags with specific evidence",
  "Green flags worth nurturing",
  "Communication pattern breakdown",
  "Relationship health indicators",
  "Brutally honest roast",
  "Astrology reading from your communication style",
  "Hard truths you need to hear",
  "What this reveals about you both",
];

const INTENT_OPTIONS: { id: Intent; label: string; desc: string }[] = [
  { id: "conversation", label: "Emotional Dynamics", desc: "What's really being said between the lines" },
  { id: "pattern",      label: "Behaviour Patterns",  desc: "How this relationship has evolved over time" },
  { id: "style",        label: "Communication Style",  desc: "How each person expresses and withholds" },
];

function ScoreDimension({ item, delay }: { item: typeof SCORE_DIMENSIONS[0]; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="card p-3 flex items-start gap-3">
      <span style={{ fontSize: "18px", flexShrink: 0 }}>{item.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="font-display font-bold text-xs" style={{ color: "var(--text)" }}>{item.label}</p>
          <span className="px-2 py-0.5 rounded font-mono font-bold" style={{ fontSize: "8px", background: `${item.color}18`, color: item.color, flexShrink: 0 }}>{item.range}</span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{item.desc}</p>
      </div>
    </motion.div>
  );
}

export default function AnalyzePage() {
  const router = useRouter();
  const [inputType, setInputType] = useState<InputType>("text");
  const [intent, setIntent]       = useState<Intent>("conversation");
  const [text, setText]           = useState("");
  const [files, setFiles]         = useState<File[]>([]);
  const [loading, setLoading]     = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter(f =>
      f.type.startsWith("image/") || f.type === "text/plain" || f.name.endsWith(".txt")
    );
    if (valid.length === 0) { toast.error("Only images (.jpg, .png) or .txt files accepted."); return; }
    if (valid.length > 3) { toast.error("Max 3 files at once."); return; }
    setFiles(valid);
  }, []);

  const submit = async () => {
    if (inputType === "text" && text.trim().length < 50) {
      toast.error("Paste at least 50 characters of conversation."); return;
    }
    if (inputType === "screenshot" && files.length === 0) {
      toast.error("Upload at least one screenshot."); return;
    }

    setLoading(true);
    try {
      let analysisId: string;

      if (inputType === "text") {
        const r = await api.post("/api/analyze", { text: text.trim(), intent });
        analysisId = r.data.analysis_id;
      } else {
        const fd = new FormData();
        files.forEach(f => fd.append("files", f));
        fd.append("intent", intent);
        fd.append("input_type", "screenshot");
        const r = await api.post("/api/analyze/upload", fd);
        analysisId = r.data.analysis_id;
      }

      router.push(`/results/${analysisId}`);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || "Analysis failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3 sm:px-5 md:px-8 py-4 md:py-8 max-w-3xl">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="label mb-2" style={{ fontSize: "9px", color: "var(--primary)" }}>Deep Analysis</p>
        <h1 className="font-display font-bold mb-1" style={{ fontSize: "clamp(1.3rem,5vw,1.875rem)", color: "var(--text)" }}>
          Analyse Your Conversation
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Paste text or upload screenshots. Get a brutally honest 11-section report in ~60 seconds.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT: Input ── */}
        <div>
          {/* Input type tabs */}
          <div className="flex gap-1 p-1 rounded mb-4" style={{ background: "var(--surface-alt)" }}>
            {(["text", "screenshot"] as InputType[]).map(t => (
              <button key={t} onClick={() => setInputType(t)} className="flex-1 py-2.5 rounded font-display font-bold capitalize transition-all"
                style={{ fontSize: "12px", ...(t === inputType ? { background: "var(--bg)", color: "var(--text)", boxShadow: "var(--shadow-sm)" } : { color: "var(--muted)" }) }}>
                {t === "text" ? "Paste Text" : "Screenshot"}
              </button>
            ))}
          </div>

          {/* Text input */}
          {inputType === "text" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="relative mb-4">
                <textarea value={text} onChange={e => setText(e.target.value)}
                  placeholder={`Paste your conversation here...\n\nFormat:\nYou: hey, are you free tonight?\nThem: yeah what's up\nYou: wanted to talk about us\n\nWorks with WhatsApp exports, manual copy-paste, any format.`}
                  rows={12} className="input w-full resize-none"
                  style={{ fontSize: "13px", lineHeight: "1.6", paddingBottom: "36px", fontFamily: "var(--font-mono)" }}/>
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <span className="label" style={{ fontSize: "8px" }}>{text.length} chars</span>
                  {text.length > 0 && (
                    <button onClick={() => setText("")} className="label hover:text-red-500 transition-colors" style={{ fontSize: "8px" }}>CLEAR</button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Screenshot upload */}
          {inputType === "screenshot" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
              <input ref={fileRef} type="file" accept="image/*,.txt" multiple className="hidden"
                onChange={e => handleFiles(e.target.files)}/>
              <div onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                className="w-full py-10 rounded flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
                style={{ border: `2px dashed ${dragOver ? "var(--primary)" : "var(--line-2)"}`, background: dragOver ? "var(--pri-soft)" : "var(--surface)" }}>
                <span style={{ fontSize: "2.5rem" }}>📸</span>
                {files.length > 0 ? (
                  <div className="text-center">
                    {files.map(f => (
                      <p key={f.name} className="font-display font-bold text-sm" style={{ color: "var(--text)" }}>{f.name}</p>
                    ))}
                    <p className="label mt-1" style={{ fontSize: "9px" }}>{files.length} file{files.length !== 1 ? "s" : ""} ready</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <p className="font-display font-bold text-sm" style={{ color: "var(--text)" }}>Drop screenshots or tap to upload</p>
                      <p className="label mt-1" style={{ fontSize: "9px" }}>JPG, PNG, WEBP · Up to 3 files · Max 5MB each</p>
                    </div>
                  </>
                )}
              </div>
              {files.length > 0 && (
                <button onClick={() => setFiles([])} className="label mt-2 hover:text-red-500 transition-colors" style={{ fontSize: "9px" }}>
                  CLEAR FILES
                </button>
              )}
            </motion.div>
          )}

          {/* Intent selector */}
          <div className="mb-4">
            <p className="label mb-2" style={{ fontSize: "9px" }}>ANALYSIS FOCUS</p>
            <div className="space-y-2">
              {INTENT_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setIntent(opt.id)}
                  className="w-full p-3 rounded text-left transition-all"
                  style={{ background: intent === opt.id ? "var(--pri-soft)" : "var(--surface-alt)", border: `1px solid ${intent === opt.id ? "var(--pri-border)" : "transparent"}` }}>
                  <p className="font-display font-bold text-xs mb-0.5" style={{ color: intent === opt.id ? "var(--primary)" : "var(--text)" }}>{opt.label}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button onClick={submit} disabled={loading}
            className="btn btn-primary w-full"
            style={{ padding: "14px", fontSize: "13px", gap: "8px" }}>
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Submitting analysis...</>
            ) : (
              "Run Deep Analysis →"
            )}
          </button>
          <p className="label text-center mt-2" style={{ fontSize: "9px" }}>Takes 20–60 seconds · Brutally honest · No sugarcoating</p>
        </div>

        {/* ── RIGHT: What you'll get ── */}
        <div>
          {/* Score dimensions */}
          <div className="mb-4">
            <p className="label mb-3" style={{ fontSize: "9px" }}>CORE SCORES</p>
            <div className="grid grid-cols-1 gap-2">
              {SCORE_DIMENSIONS.map((d, i) => <ScoreDimension key={d.label} item={d} delay={i * .06}/>)}
            </div>
          </div>

          {/* Sub metrics */}
          <div className="mb-4">
            <p className="label mb-3" style={{ fontSize: "9px" }}>SUB-METRICS</p>
            <div className="card overflow-hidden">
              {SUB_METRICS.map((m, i) => (
                <div key={m.label} className="flex items-start gap-3 px-4 py-3"
                  style={{ borderBottom: i < SUB_METRICS.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <span style={{ fontSize: "16px", flexShrink: 0 }}>{m.icon}</span>
                  <div>
                    <p className="font-display font-bold text-xs mb-0.5" style={{ color: "var(--text)" }}>{m.label}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full report sections */}
          <div>
            <p className="label mb-3" style={{ fontSize: "9px" }}>YOUR REPORT INCLUDES</p>
            <div className="card p-4">
              <div className="grid grid-cols-1 gap-1.5">
                {REPORT_SECTIONS.map((s, i) => (
                  <motion.div key={s} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .3 + i * .04 }}
                    className="flex items-center gap-2">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{s}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-3 flex items-center gap-2" style={{ borderTop: "1px solid var(--line)" }}>
                <span style={{ fontSize: "14px" }}>🔮</span>
                <p className="text-xs italic" style={{ color: "var(--primary)" }}>+ Astrology reading inferred from your communication patterns</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
