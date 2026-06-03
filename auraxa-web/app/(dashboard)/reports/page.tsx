"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";

interface Analysis {
  id: string; speakers?: { a?: string; b?: string }; created_at: string;
  message_count?: number; status: string;
  scores?: { overall_score: number; compatibility_score: number; toxicity_level: string; ghosting_risk: string; };
}

const SC: Record<string, string> = {
  low: "var(--green)", medium: "var(--amber)", high: "var(--red)", critical: "var(--red)"
};

const TrashIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

function DeleteModal({ name, onConfirm, onCancel, loading }: {
  name: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }} transition={{ duration: .25, ease: [.16,1,.3,1] }}
        className="w-full sm:max-w-sm"
        style={{ background: "var(--bg)", borderRadius: "12px 12px 0 0", padding: "28px 24px 40px" }}
        onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--line-2)" }}/>

        {/* Icon */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ background: "#fff0f0" }}>
          <TrashIcon size={20} color="var(--red)"/>
        </div>

        <h3 className="font-display text-lg font-bold mb-1" style={{ color: "var(--text)" }}>
          Delete this report?
        </h3>
        <p className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>{name}</p>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--muted)" }}>
          This permanently removes the analysis, scores, timeline, and AI advisor history. This cannot be undone.
        </p>

        {/* Buttons — stacked, Delete on top */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button onClick={onConfirm} disabled={loading}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", borderRadius: "6px", background: "#cc0000", color: "#ffffff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px", letterSpacing: "0.05em", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading
              ? <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/>
              : <><TrashIcon size={14} color="#fff"/>&nbsp;Delete Forever</>}
          </button>
          <button onClick={onCancel}
            style={{ width: "100%", padding: "14px", borderRadius: "6px", background: "#f0f0f2", color: "#1e1a2e", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px", letterSpacing: "0.05em", border: "1px solid rgba(0,0,0,.1)", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={e => { e.preventDefault(); e.stopPropagation(); onChange(); }}
      className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-all"
      style={{
        background: checked ? "var(--primary)" : "var(--bg)",
        border: `2px solid ${checked ? "var(--primary)" : "var(--line-2)"}`,
        boxShadow: checked ? "0 0 0 3px rgba(108,85,224,.15)" : "none",
      }}>
      {checked && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      )}
    </button>
  );
}

export default function ReportsPage() {
  const [analyses, setAnalyses]     = useState<Analysis[]>([]);
  const [loading, setLoading]       = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Analysis | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = useCallback(async () => {
    try { const r = await api.get("/api/analyze"); setAnalyses(r.data?.analyses ?? r.data ?? []); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/analyze/${deleteTarget.id}`);
      setAnalyses(prev => prev.filter(a => a.id !== deleteTarget.id));
      toast.success("Report deleted.");
      setDeleteTarget(null);
    } catch (e: any) { toast.error(e?.response?.data?.detail || "Delete failed."); }
    finally { setDeleting(false); }
  };

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    let deleted = 0;
    for (const id of selected) { try { await api.delete(`/api/analyze/${id}`); deleted++; } catch {} }
    setAnalyses(prev => prev.filter(a => !selected.has(a.id)));
    setSelected(new Set()); setSelectMode(false);
    toast.success(`${deleted} report${deleted !== 1 ? "s" : ""} deleted.`);
    setBulkDeleting(false);
  };

  const reportName = (a: Analysis) => `${a.speakers?.a ?? "You"} & ${a.speakers?.b ?? "Them"}`;

  return (
    <div className="px-3 sm:px-5 md:px-8 py-4 md:py-8 max-w-4xl">

      {/* Header */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        className="mb-5 md:mb-8 flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="label mb-2" style={{ fontSize:"9px", color:"var(--primary)" }}>Your History</p>
          <h1 className="font-display font-bold" style={{ fontSize:"clamp(1.3rem,5vw,1.875rem)", color:"var(--text)" }}>All Reports</h1>
        </div>
        <div className="flex items-center gap-2">
          {analyses.length > 0 && (
            <button
              onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
              className="btn btn-secondary"
              style={{ fontSize:"11px", padding:"8px 14px" }}>
              {selectMode ? "Cancel" : "Select"}
            </button>
          )}
          <Link href="/analyze" className="btn btn-primary" style={{ fontSize:"11px", padding:"9px 16px" }}>
            New Reading +
          </Link>
        </div>
      </motion.div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectMode && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            className="flex items-center justify-between gap-3 mb-4 px-4 py-3 rounded"
            style={{ background:"var(--surface-alt)", border:"1px solid var(--line)" }}>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-display font-bold" style={{ color:"var(--text)" }}>
                {selected.size} selected
              </span>
              <button onClick={() => setSelected(new Set(analyses.map(a => a.id)))}
                className="label hover:text-primary transition-colors" style={{ fontSize:"9px" }}>
                Select all
              </button>
              {selected.size > 0 && (
                <button onClick={() => setSelected(new Set())}
                  className="label hover:text-primary transition-colors" style={{ fontSize:"9px" }}>
                  Clear
                </button>
              )}
            </div>
            {selected.size > 0 && (
              <button onClick={bulkDelete} disabled={bulkDeleting}
                className="flex items-center gap-2 px-4 py-2.5 rounded font-display font-bold text-xs"
                style={{ background:"#1e1a2e", color:"#fff", letterSpacing:"0.05em", border:"none", cursor:"pointer", flexShrink:0 }}>
                {bulkDeleting
                  ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  : <TrashIcon size={12} color="#fff"/>}
                DELETE {selected.size}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="card h-32 shimmer"/>)}
        </div>
      ) : analyses.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded mx-auto mb-4 flex items-center justify-center text-2xl"
            style={{ background:"var(--surface-alt)", color:"var(--primary)" }}>▤</div>
          <h3 className="font-display text-base font-bold mb-2" style={{ color:"var(--text)" }}>No Reports Yet</h3>
          <p className="text-sm mb-6" style={{ color:"var(--muted)" }}>Your analysed conversations will appear here.</p>
          <Link href="/analyze" className="btn btn-primary">Begin First Reading →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {analyses.map((a, i) => {
            const isSelected = selected.has(a.id);
            return (
              <motion.div key={a.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.04 }}>
                <div className="card p-4 relative group"
                  style={{
                    border: isSelected ? "2px solid var(--primary)" : "1px solid var(--line)",
                    background: isSelected ? "var(--pri-soft)" : "var(--bg)",
                    transition: "all .15s",
                  }}>
                  <div className="flex items-start gap-3">

                    {/* Checkbox — always visible in select mode */}
                    {selectMode && (
                      <div className="mt-0.5 flex-shrink-0">
                        <Checkbox checked={isSelected} onChange={() => toggleSelect(a.id)}/>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-1">
                          <Link href={`/results/${a.id}`} className="hover:text-primary transition-colors">
                            <p className="font-display text-sm font-bold" style={{ color:"var(--text)" }}>{reportName(a)}</p>
                          </Link>
                          <p className="text-[10px] font-mono mt-0.5" style={{ color:"var(--muted-2)" }}>
                            {new Date(a.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                            {a.message_count?` · ${a.message_count} msgs`:""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {a.status==="completed"&&a.scores?(
                            <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background:"var(--surface-alt)" }}>
                              <span className="font-display text-sm font-bold" style={{ color:"var(--text)" }}>{a.scores.overall_score}</span>
                            </div>
                          ):(
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono capitalize" style={{ background:"var(--pri-soft)", color:"var(--primary)" }}>{a.status}</span>
                          )}
                          {/* Trash icon — always visible on mobile, hover on desktop */}
                          {!selectMode && (
                            <button onClick={() => setDeleteTarget(a)}
                              className="w-8 h-8 rounded flex items-center justify-center transition-all sm:opacity-0 sm:group-hover:opacity-100"
                              style={{ background:"#fff0f0", border:"1px solid rgba(204,0,0,.2)", flexShrink:0 }}
                              title="Delete report">
                              <TrashIcon size={13} color="var(--red)"/>
                            </button>
                          )}
                        </div>
                      </div>

                      {a.scores && (
                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                          {[
                            {l:"Compat",   v:`${a.scores.compatibility_score}%`, c:"var(--primary)"},
                            {l:"Toxicity", v:a.scores.toxicity_level, c:SC[a.scores.toxicity_level]??"var(--muted)"},
                            {l:"Ghost",    v:a.scores.ghosting_risk,  c:SC[a.scores.ghosting_risk]??"var(--muted)"},
                          ].map(m=>(
                            <div key={m.l} className="text-center rounded py-1.5" style={{ background:"var(--surface-alt)" }}>
                              <p className="font-display text-xs font-bold capitalize" style={{ color:m.c }}>{m.v}</p>
                              <p className="label mt-0.5" style={{ fontSize:"7px" }}>{m.l}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <Link href={`/results/${a.id}`} className="label hover:text-primary transition-colors" style={{ color:"var(--primary)", fontSize:"9px" }}>
                        View Report →
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            name={reportName(deleteTarget)}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
