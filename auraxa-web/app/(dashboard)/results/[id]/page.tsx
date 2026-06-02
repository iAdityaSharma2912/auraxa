"use client";

import { useEffect, useState, useCallback, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";

interface Scores {
  overall_score: number; compatibility_score: number;
  toxicity_level: string; ghosting_risk: string;
  attachment_style?: string; patterns_detected: string[];
}
interface Result {
  id: string; status: string; speakers?: { a?: string; b?: string };
  scores?: Scores; ai_narrative?: string; message_count?: number;
}

const SCORE_COLORS: Record<string, string> = { low: "#3457d5", medium: "#5c5e62", high: "#cc0000", critical: "#cc0000" };

// ── Score ring ──
function ScoreRing({ score }: { score: number }) {
  const r = 70, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative" style={{ width: 170, height: 170 }}>
      <svg width="170" height="170" className="-rotate-90">
        <circle cx="85" cy="85" r={r} fill="none" stroke="var(--surface-alt)" strokeWidth="10" />
        <motion.circle cx="85" cy="85" r={r} fill="none" stroke="#3457d5" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold" style={{ color: "#171a20" }}>{score}</span>
        <span className="label">Overall</span>
      </div>
    </div>
  );
}

// ── Astrology / Palm sub-tabs (merged into results) ──
function CosmicSection({ result }: { result: Result }) {
  const [sub, setSub] = useState<"from-chat" | "birth" | "palm">("from-chat");
  const [loading, setLoading] = useState(false);
  const [chatRes, setChatRes] = useState<any>(null);
  const [palmFile, setPalmFile] = useState<File | null>(null);
  const [palmRes, setPalmRes] = useState<any>(null);
  const [aDob, setADob] = useState(""); const [bDob, setBDob] = useState("");
  const [birthRes, setBirthRes] = useState<any>(null);

  const runFromChat = async () => {
    setLoading(true); setChatRes(null);
    try {
      const res = await api.post("/api/astrology/from-chat", {
        ai_narrative: result.ai_narrative ?? "",
        patterns: result.scores?.patterns_detected ?? [],
        speakers: result.speakers ?? {},
        compatibility_score: result.scores?.compatibility_score,
        attachment_style: result.scores?.attachment_style,
        ghosting_risk: result.scores?.ghosting_risk,
      });
      setChatRes(res.data);
    } catch (err: any) { toast.error(err?.response?.data?.detail || "Reading failed."); }
    finally { setLoading(false); }
  };

  const runBirth = async () => {
    if (!aDob || !bDob) { toast.error("Enter both DOBs."); return; }
    setLoading(true); setBirthRes(null);
    try {
      const res = await api.post("/api/astrology/compatibility", {
        person_a_dob: aDob, person_a_name: result.speakers?.a ?? "You",
        person_b_dob: bDob, person_b_name: result.speakers?.b ?? "Them",
      });
      setBirthRes(res.data);
    } catch (err: any) { toast.error(err?.response?.data?.detail || "Failed."); }
    finally { setLoading(false); }
  };

  const runPalm = async () => {
    if (!palmFile) { toast.error("Upload a palm photo."); return; }
    setLoading(true); setPalmRes(null);
    try {
      const fd = new FormData(); fd.append("file", palmFile);
      const res = await api.post("/api/palm/analyse", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setPalmRes(res.data);
    } catch (err: any) { toast.error(err?.response?.data?.detail || "Failed."); }
    finally { setLoading(false); }
  };

  const SUBS = [
    { id: "from-chat" as const, label: "From Chat" },
    { id: "birth" as const, label: "By Birth Date" },
    { id: "palm" as const, label: "Palm Reading" },
  ];

  return (
    <div className="card p-6">
      <p className="label mb-4" style={{ color: "#3457d5" }}>Astrology & Palm</p>
      <div className="flex gap-1 p-1 rounded mb-5" style={{ background: "var(--surface-alt)" }}>
        {SUBS.map(s => (
          <button key={s.id} onClick={() => setSub(s.id)}
            className="flex-1 py-2 rounded text-xs font-display font-semibold transition-all"
            style={s.id === sub ? { background: "#fff", color: "#171a20", boxShadow: "var(--shadow-sm)" } : { color: "#5c5e62" }}>
            {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {sub === "from-chat" && (
          <motion.div key="fc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {!chatRes ? (
              <button onClick={runFromChat} disabled={loading} className="btn btn-primary w-full">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Read From Conversation →"}
              </button>
            ) : (
              <div className="space-y-3">
                {chatRes.compatibility_score != null && (
                  <div className="text-center py-2">
                    <p className="font-display text-3xl font-bold" style={{ color: "#3457d5" }}>{chatRes.compatibility_score}%</p>
                    <p className="label">Cosmic Compatibility</p>
                  </div>
                )}
                {chatRes.cosmic_reading && <p className="text-sm leading-relaxed" style={{ color: "#5c5e62" }}>{chatRes.cosmic_reading}</p>}
                {chatRes.guidance && (
                  <div className="rounded p-4" style={{ background: "var(--surface-alt)" }}>
                    <p className="label mb-1">Guidance</p>
                    <p className="text-sm" style={{ color: "#171a20" }}>{chatRes.guidance}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {sub === "birth" && (
          <motion.div key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label mb-2 block">{result.speakers?.a ?? "You"}</label>
                <input type="date" title="Person A DOB" className="input" value={aDob} onChange={e => setADob(e.target.value)} />
              </div>
              <div>
                <label className="label mb-2 block">{result.speakers?.b ?? "Them"}</label>
                <input type="date" title="Person B DOB" className="input" value={bDob} onChange={e => setBDob(e.target.value)} />
              </div>
            </div>
            <button onClick={runBirth} disabled={loading} className="btn btn-primary w-full">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Analyse Compatibility →"}
            </button>
            {birthRes && (
              <div className="text-center pt-2">
                <p className="font-display text-3xl font-bold" style={{ color: "#3457d5" }}>{birthRes.compatibility_score ?? birthRes.score}%</p>
                {birthRes.summary && <p className="text-sm mt-2 leading-relaxed text-left" style={{ color: "#5c5e62" }}>{birthRes.summary}</p>}
              </div>
            )}
          </motion.div>
        )}

        {sub === "palm" && (
          <motion.div key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <input id="palm-r" type="file" accept="image/*" className="hidden" onChange={e => setPalmFile(e.target.files?.[0] ?? null)} />
            <label htmlFor="palm-r" className="block w-full py-8 rounded text-center cursor-pointer" style={{ border: "2px dashed var(--line)" }}>
              <span className="text-2xl block mb-1" style={{ color: "#3457d5" }}>✋</span>
              <p className="text-sm font-display font-semibold" style={{ color: "#171a20" }}>{palmFile ? palmFile.name : "Upload palm photo"}</p>
            </label>
            <button onClick={runPalm} disabled={loading || !palmFile} className="btn btn-primary w-full">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Read My Palm →"}
            </button>
            {palmRes && (
              <div className="space-y-2 pt-1">
                {["heart_line", "head_line", "life_line"].map(l => palmRes[l] && (
                  <div key={l} className="rounded p-3" style={{ background: "var(--surface-alt)" }}>
                    <p className="label mb-1" style={{ color: "#3457d5" }}>{l.replace("_", " ")}</p>
                    <p className="text-sm" style={{ color: "#5c5e62" }}>{palmRes[l]}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
  try {
    // First check status
    const statusRes = await api.get(`/api/analyze/${id}/status`);
    const status = statusRes.data?.status;

    if (status === "completed") {
      // Fetch full results
      const resultsRes = await api.get(`/api/analyze/${id}/results`);
      setResult({ ...resultsRes.data, status: "completed" });
    } else if (status === "failed") {
      setResult({ id, status: "failed" } as any);
    } else {
      // Still processing — update status and keep polling
      setResult(prev => prev ? { ...prev, status } : { id, status } as any);
      setTimeout(load, 3000);
    }
  } catch (e) {
    console.error(e);
    // Retry on network error
    setTimeout(load, 4000);
  } finally {
    setLoading(false);
  }
}, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading && !result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-2 animate-spin" style={{ borderColor: "var(--line)", borderTopColor: "#3457d5" }} />
      </div>
    );
  }

  if (result && result.status !== "completed" && result.status !== "failed") {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-2 animate-spin mx-auto mb-6" style={{ borderColor: "var(--line)", borderTopColor: "#3457d5" }} />
          <h2 className="font-display text-xl font-bold mb-2" style={{ color: "#171a20" }}>Reading the Unsaid...</h2>
          <p style={{ color: "#5c5e62" }}>Our AI is decoding the emotional patterns. This takes about a minute.</p>
        </div>
      </div>
    );
  }

  const scores = result?.scores;

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link href="/reports" className="label hover:text-text transition-colors mb-2 inline-block">← All Reports</Link>
          <h1 className="font-display text-2xl md:text-3xl font-bold" style={{ color: "#171a20" }}>
            {result?.speakers?.a ?? "You"} & {result?.speakers?.b ?? "Them"}
          </h1>
        </div>
        <Link href={`/advisor/${id}`} className="btn btn-secondary" style={{ fontSize: "12px", padding: "10px 18px" }}>Ask Advisor →</Link>
      </motion.div>

      {scores && (
        <>
          {/* Score + key metrics */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="card p-6 mb-4 flex flex-col md:flex-row items-center gap-8">
            <ScoreRing score={scores.overall_score} />
            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
              {[
                { label: "Compatibility", value: `${scores.compatibility_score}%`, color: "#3457d5" },
                { label: "Toxicity", value: scores.toxicity_level, color: SCORE_COLORS[scores.toxicity_level] ?? "#5c5e62" },
                { label: "Ghosting Risk", value: scores.ghosting_risk, color: SCORE_COLORS[scores.ghosting_risk] ?? "#5c5e62" },
                { label: "Attachment", value: scores.attachment_style ?? "—", color: "#171a20" },
              ].map(m => (
                <div key={m.label} className="rounded p-3 text-center" style={{ background: "var(--surface-alt)" }}>
                  <p className="font-display text-lg font-bold capitalize" style={{ color: m.color }}>{m.value}</p>
                  <p className="label mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Narrative */}
          {result?.ai_narrative && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6 mb-4">
              <p className="label mb-3" style={{ color: "#3457d5" }}>AI Analysis</p>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#5c5e62" }}>{result.ai_narrative}</p>
            </motion.div>
          )}

          {/* Patterns */}
          {scores.patterns_detected?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6 mb-4">
              <p className="label mb-3" style={{ color: "#3457d5" }}>Patterns Detected</p>
              <div className="flex flex-wrap gap-2">
                {scores.patterns_detected.map(p => (
                  <span key={p} className="px-3 py-1.5 rounded text-sm" style={{ background: "var(--surface-alt)", color: "#171a20" }}>{p}</span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Astrology & Palm */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            {result && <CosmicSection result={result} />}
          </motion.div>
        </>
      )}

      {result?.status === "failed" && (
        <div className="card p-12 text-center">
          <span className="text-3xl block mb-3" style={{ color: "#cc0000" }}>✕</span>
          <h3 className="font-display text-lg font-bold mb-2" style={{ color: "#171a20" }}>Analysis Failed</h3>
          <p className="mb-6" style={{ color: "#5c5e62" }}>Something went wrong processing this conversation.</p>
          <Link href="/analyze" className="btn btn-primary">Try Again →</Link>
        </div>
      )}
    </div>
  );
}
