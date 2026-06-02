"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";

interface Analysis {
  id:string; speakers?:{a?:string;b?:string}; created_at:string;
  message_count?:number; status:string;
  scores?:{overall_score:number;compatibility_score:number;toxicity_level:string;ghosting_risk:string;patterns_detected:string[]};
}
const SC:Record<string,string>={low:"var(--green)",medium:"var(--amber)",high:"var(--red)",critical:"var(--red)"};

export default function ReportsPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const r=await api.get("/api/analyze"); setAnalyses(r.data?.analyses??r.data??[]); }
    catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="px-3 sm:px-5 md:px-8 py-4 md:py-8 max-w-4xl">
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="mb-5 md:mb-8 flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="label mb-2" style={{ fontSize:"9px", color:"var(--primary)" }}>Your History</p>
          <h1 className="font-display font-bold" style={{ fontSize:"clamp(1.3rem,5vw,1.875rem)", color:"var(--text)" }}>All Reports</h1>
        </div>
        <Link href="/analyze" className="btn btn-primary" style={{ padding:"9px 16px", fontSize:"11px" }}>New Reading +</Link>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1,2,3,4].map(i=><div key={i} className="card h-32 shimmer"/>)}
        </div>
      ) : analyses.length===0 ? (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded mx-auto mb-4 flex items-center justify-center text-2xl" style={{ background:"var(--surface-alt)", color:"var(--primary)" }}>▤</div>
          <h3 className="font-display text-base font-bold mb-2" style={{ color:"var(--text)" }}>No Reports Yet</h3>
          <p className="text-sm mb-6" style={{ color:"var(--muted)" }}>Your analysed conversations will appear here.</p>
          <Link href="/analyze" className="btn btn-primary">Begin First Reading →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {analyses.map((a,i)=>(
            <motion.div key={a.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.04 }}>
              <Link href={`/results/${a.id}`}>
                <div className="card p-4 cursor-pointer" style={{ transition:"all .2s" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-display text-sm font-bold" style={{ color:"var(--text)" }}>{a.speakers?.a??"You"} & {a.speakers?.b??"Them"}</p>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color:"var(--muted-2)" }}>
                        {new Date(a.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                        {a.message_count?` · ${a.message_count} msgs`:""}
                      </p>
                    </div>
                    {a.status==="completed"&&a.scores?(
                      <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0" style={{ background:"var(--surface-alt)" }}>
                        <span className="font-display text-sm font-bold" style={{ color:"var(--text)" }}>{a.scores.overall_score}</span>
                      </div>
                    ):(
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono capitalize" style={{ background:"var(--pri-soft)", color:"var(--primary)" }}>{a.status}</span>
                    )}
                  </div>
                  {a.scores&&(
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {[
                        {l:"Compat",v:`${a.scores.compatibility_score}%`,c:"var(--primary)"},
                        {l:"Toxicity",v:a.scores.toxicity_level,c:SC[a.scores.toxicity_level]??"var(--muted)"},
                        {l:"Ghost",v:a.scores.ghosting_risk,c:SC[a.scores.ghosting_risk]??"var(--muted)"},
                      ].map(m=>(
                        <div key={m.l} className="text-center rounded py-1.5" style={{ background:"var(--surface-alt)" }}>
                          <p className="font-display text-xs font-bold capitalize" style={{ color:m.c }}>{m.v}</p>
                          <p className="label mt-0.5" style={{ fontSize:"7px" }}>{m.l}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-right" style={{ color:"var(--primary)" }}>View Report →</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
