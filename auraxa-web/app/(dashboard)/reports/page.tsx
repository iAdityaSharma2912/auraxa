"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";

interface Analysis {
  id: string; speakers?: { a?: string; b?: string }; created_at: string;
  message_count?: number; status: string;
  scores?: { overall_score: number; compatibility_score: number; toxicity_level: string; ghosting_risk: string; patterns_detected: string[] };
}

const SCORE_COLORS: Record<string, string> = { low: "#3457d5", medium: "#5c5e62", high: "#cc0000", critical: "#cc0000" };

function AnalysisCard({ item, index }: { item: Analysis; index: number }) {
  const scores = item.scores;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      whileHover={{ y: -3 }}>
      <Link href={`/results/${item.id}`}>
        <div className="card card-hover p-5 cursor-pointer group">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-display text-sm font-semibold" style={{ color: "#171a20" }}>
                {item.speakers?.a ?? "You"} & {item.speakers?.b ?? "Them"}
              </p>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: "#5c5e62" }}>
                {new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {item.message_count ? ` · ${item.message_count} msgs` : ""}
              </p>
            </div>
            {item.status === "completed" && scores ? (
              <div className="w-11 h-11 rounded flex items-center justify-center" style={{ background: "var(--surface-alt)" }}>
                <span className="font-display text-base font-bold" style={{ color: "#171a20" }}>{scores.overall_score}</span>
              </div>
            ) : (
              <span className="px-2.5 py-1 rounded text-[10px] font-mono capitalize" style={{ background: "rgba(52,87,213,.08)", color: "#3457d5" }}>{item.status}</span>
            )}
          </div>
          {scores && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: "Compat", value: `${scores.compatibility_score}%`, color: "#3457d5" },
                { label: "Toxicity", value: scores.toxicity_level, color: SCORE_COLORS[scores.toxicity_level] ?? "#5c5e62" },
                { label: "Ghost", value: scores.ghosting_risk, color: SCORE_COLORS[scores.ghosting_risk] ?? "#5c5e62" },
              ].map(s => (
                <div key={s.label} className="text-center rounded py-2" style={{ background: "var(--surface-alt)" }}>
                  <p className="font-display text-sm font-semibold capitalize" style={{ color: s.color }}>{s.value}</p>
                  <p className="label mt-0.5" style={{ fontSize: "8px" }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
          {(scores?.patterns_detected?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {scores?.patterns_detected?.slice(0, 4).map((p: string) => (
                <span key={p} className="px-2 py-0.5 rounded text-[10px]" style={{ background: "var(--surface-alt)", color: "#5c5e62" }}>{p}</span>
              ))}
            </div>
          )}
          <p className="text-[11px] text-right mt-3" style={{ color: "#3457d5" }}>View Report →</p>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ReportsPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const res = await api.get("/api/analyze"); setAnalyses(res.data?.analyses ?? res.data ?? []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="label mb-2" style={{ color: "#3457d5" }}>Your History</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold" style={{ color: "#171a20" }}>All Reports</h1>
        </div>
        <Link href="/analyze" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: "12px" }}>New Reading +</Link>
      </motion.div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card p-5 h-44 shimmer" />)}
        </div>
      ) : analyses.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded mx-auto mb-6 flex items-center justify-center" style={{ background: "var(--surface-alt)" }}>
            <span className="text-3xl" style={{ color: "#3457d5" }}>▤</span>
          </div>
          <h3 className="font-display text-lg font-semibold mb-2" style={{ color: "#171a20" }}>No Reports Yet</h3>
          <p className="mb-8 max-w-sm mx-auto" style={{ color: "#5c5e62" }}>Your analysed conversations will appear here.</p>
          <Link href="/analyze" className="btn btn-primary">Begin First Reading →</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {analyses.map((a, i) => <AnalysisCard key={a.id} item={a} index={i} />)}
        </div>
      )}
    </div>
  );
}
