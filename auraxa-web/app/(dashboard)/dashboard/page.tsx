"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";

interface DailyInsight {
  energy_level: number; energy_label: string; energy_note: string;
  insight: string; guidance: string; dominant_element: string;
  moon_phase: string; power_hour: string;
}
interface Analysis {
  id: string; speakers?: { a?: string; b?: string }; created_at: string;
  message_count?: number; status: string;
  scores?: { overall_score: number; compatibility_score: number; toxicity_level: string; ghosting_risk: string; patterns_detected: string[] };
}
interface UserProfile {
  name: string; email: string; subscription_tier: string;
  analyses_used_month: number; created_at: string;
}

function greeting(name: string) {
  const h = new Date().getHours();
  if (h < 5)  return `Still awake, ${name}`;
  if (h < 12) return `Good morning, ${name}`;
  if (h < 17) return `Good afternoon, ${name}`;
  if (h < 21) return `Good evening, ${name}`;
  return `Good night, ${name}`;
}

const SCORE_COLOR: Record<string, string> = {
  low:"var(--green)", medium:"var(--amber)", high:"var(--red)", critical:"var(--red)"
};

const QUICK = [
  { href:"/analyze",   icon:"◫", label:"New Analysis", desc:"Paste or upload" },
  { href:"/astrology", icon:"◈", label:"Astrology",    desc:"Stars & palm" },
  { href:"/reports",   icon:"▤", label:"All Reports",  desc:"Past analyses" },
  { href:"/profile",   icon:"◇", label:"Profile",      desc:"Your details" },
];

function Shimmer() {
  return <div className="card h-36 shimmer" />;
}

function CosmicCard({ insight }: { insight: DailyInsight }) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="label mb-3" style={{ fontSize:"9px", color:"var(--primary)" }}>Daily Cosmic Energy</p>
      <div className="flex items-end gap-3 mb-2">
        <span className="font-display font-bold" style={{ fontSize:"clamp(28px,8vw,40px)", color:"var(--text)", lineHeight:1 }}>{insight.energy_level}</span>
        <span className="text-base mb-0.5" style={{ color:"var(--primary)" }}>{insight.energy_label}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background:"var(--surface-alt)" }}>
        <motion.div initial={{ width:0 }} animate={{ width:`${insight.energy_level}%` }} transition={{ duration:1.4, delay:0.3 }}
          className="h-full rounded-full" style={{ background:"var(--primary)" }} />
      </div>
      <p className="text-xs leading-relaxed mb-3" style={{ color:"var(--muted)" }}>{insight.energy_note}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background:"var(--pri-soft)", color:"var(--primary)", border:"1px solid var(--pri-border)" }}>{insight.dominant_element}</span>
        <span className="text-[10px] font-mono" style={{ color:"var(--muted-2)" }}>◦ {insight.moon_phase}</span>
        <span className="text-[10px] font-mono" style={{ color:"var(--muted-2)" }}>◦ {insight.power_hour}</span>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: DailyInsight }) {
  return (
    <div className="card p-4 sm:p-5 flex flex-col gap-3">
      <p className="label" style={{ fontSize:"9px", color:"var(--primary)" }}>Today's Insight</p>
      <div className="flex gap-2">
        <span className="text-lg flex-shrink-0 mt-0.5" style={{ color:"var(--primary)" }}>◈</span>
        <p className="text-sm leading-relaxed" style={{ color:"var(--text)" }}>{insight.insight}</p>
      </div>
      <div className="flex gap-2 pt-2" style={{ borderTop:"1px solid var(--line)" }}>
        <span className="text-lg flex-shrink-0 mt-1" style={{ color:"var(--muted-2)" }}>◇</span>
        <p className="text-xs leading-relaxed mt-1" style={{ color:"var(--muted)" }}>{insight.guidance}</p>
      </div>
    </div>
  );
}

function AnalysisCard({ item }: { item: Analysis }) {
  const s = item.scores;
  return (
    <motion.div whileHover={{ y:-2 }} transition={{ duration:.2 }}>
      <Link href={`/results/${item.id}`}>
        <div className="card p-4 cursor-pointer" style={{ transition:"all .2s" }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-display text-sm font-bold" style={{ color:"var(--text)" }}>{item.speakers?.a??"You"} & {item.speakers?.b??"Them"}</p>
              <p className="text-[10px] font-mono mt-0.5" style={{ color:"var(--muted-2)" }}>
                {new Date(item.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
                {item.message_count?` · ${item.message_count} msgs`:""}
              </p>
            </div>
            {item.status==="completed"&&s ? (
              <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0" style={{ background:"var(--surface-alt)" }}>
                <span className="font-display text-sm font-bold" style={{ color:"var(--text)" }}>{s.overall_score}</span>
              </div>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono capitalize" style={{ background:"var(--pri-soft)", color:"var(--primary)" }}>{item.status}</span>
            )}
          </div>
          {s && (
            <div className="grid grid-cols-3 gap-1.5">
              {[
                {l:"Compat", v:`${s.compatibility_score}%`, c:"var(--primary)"},
                {l:"Toxicity", v:s.toxicity_level, c:SCORE_COLOR[s.toxicity_level]??"var(--muted)"},
                {l:"Ghost", v:s.ghosting_risk, c:SCORE_COLOR[s.ghosting_risk]??"var(--muted)"},
              ].map(m=>(
                <div key={m.l} className="text-center rounded py-1.5" style={{ background:"var(--surface-alt)" }}>
                  <p className="font-display text-xs font-bold capitalize" style={{ color:m.c }}>{m.v}</p>
                  <p className="label mt-0.5" style={{ fontSize:"7px" }}>{m.l}</p>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-right mt-2" style={{ color:"var(--primary)" }}>View →</p>
        </div>
      </Link>
    </motion.div>
  );
}

function UsageWidget({ profile }: { profile: UserProfile }) {
  const tier=profile.subscription_tier, used=profile.analyses_used_month;
  const limit=tier==="pro"?9999:tier==="premium"?20:3;
  const pct=limit>=9999?3:Math.min((used/limit)*100,100);
  const full=used>=limit&&limit<9999;
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="label" style={{ fontSize:"9px" }}>Usage This Month</p>
        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold capitalize" style={{ background:"var(--surface-alt)", color:"var(--text)" }}>{tier}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="font-display text-2xl font-bold" style={{ color:"var(--text)" }}>{used}</span>
        <span className="text-sm" style={{ color:"var(--muted)" }}>/ {limit>=9999?"∞":limit}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background:"var(--surface-alt)" }}>
        <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:1, delay:.5 }}
          className="h-full rounded-full" style={{ background:full?"var(--red)":"var(--primary)" }}/>
      </div>
      {full?<Link href="/upgrade" className="text-[11px]" style={{ color:"var(--red)" }}>Limit reached — upgrade →</Link>
        :tier==="free"?<Link href="/upgrade" className="text-[11px]" style={{ color:"var(--primary)" }}>Unlock unlimited →</Link>:null}
    </div>
  );
}

export default function DashboardPage() {
  const [analyses, setAnalyses]     = useState<Analysis[]>([]);
  const [profile, setProfile]       = useState<UserProfile|null>(null);
  const [insight, setInsight]       = useState<DailyInsight|null>(null);
  const [insightLoad, setInsightLoad] = useState(true);
  const [pageLoad, setPageLoad]     = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [a, p] = await Promise.all([api.get("/api/analyze"), api.get("/api/users/me")]);
      setAnalyses(a.data?.analyses??a.data??[]);
      setProfile(p.data);
    } catch {}
    finally { setPageLoad(false); }
  }, []);

  const loadInsight = useCallback(async () => {
    try { const r=await api.get("/api/daily-insight"); setInsight(r.data); }
    catch { setInsight({ energy_level:72, energy_label:"Luminous", energy_note:"Clear perception today. Trust what you feel.",
      insight:"The stars align for emotional clarity.", guidance:"Speak your truth with kindness.",
      dominant_element:"Air", moon_phase:"Waxing Gibbous", power_hour:"7–9 PM" }); }
    finally { setInsightLoad(false); }
  }, []);

  useEffect(() => { loadData(); loadInsight(); }, [loadData, loadInsight]);

  const firstName = profile?.name?.split(" ")[0] ?? "Seeker";

  if (pageLoad) {
    return <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor:"var(--line-2)", borderTopColor:"var(--primary)" }}/>
    </div>;
  }

  return (
    <div className="px-3 sm:px-5 md:px-8 py-4 md:py-8 max-w-4xl">
      {/* Greeting */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:.4 }} className="mb-5 md:mb-8 flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="label mb-1" style={{ fontSize:"9px" }}>
            {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}
          </p>
          <h1 className="font-display font-bold" style={{ fontSize:"clamp(1.25rem,5vw,1.875rem)", color:"var(--text)" }}>
            {greeting(firstName)}
          </h1>
        </div>
        <Link href="/analyze" className="btn btn-primary" style={{ padding:"9px 16px", fontSize:"11px" }}>
          New Reading +
        </Link>
      </motion.div>

      {/* Cosmic widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1 }}>
          {insightLoad ? <Shimmer/> : insight ? <CosmicCard insight={insight}/> : null}
        </motion.div>
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.15 }}>
          {insightLoad ? <Shimmer/> : insight ? <InsightCard insight={insight}/> : null}
        </motion.div>
      </div>

      {/* Quick actions — 2x2 on mobile, 4x1 on desktop */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.2 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {QUICK.map(a=>(
          <Link key={a.href} href={a.href}>
            <div className="card p-3 text-center cursor-pointer group" style={{ transition:"all .2s" }}>
              <div className="w-9 h-9 rounded mx-auto mb-2 flex items-center justify-center text-base" style={{ background:"var(--surface-alt)" }}>
                <span style={{ color:"var(--primary)" }}>{a.icon}</span>
              </div>
              <p className="font-display text-xs font-bold" style={{ color:"var(--text)", fontSize:"10px" }}>{a.label}</p>
              <p className="text-[9px] mt-0.5" style={{ color:"var(--muted-2)" }}>{a.desc}</p>
            </div>
          </Link>
        ))}
      </motion.div>

      {/* Usage */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.3 }} className="mb-5">
        {profile && <UsageWidget profile={profile}/>}
      </motion.div>

      {/* Recent analyses */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.4 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-bold" style={{ color:"var(--text)" }}>Recent Readings</h2>
          {analyses.length>0&&<Link href="/reports" className="label hover:text-primary transition-colors" style={{ fontSize:"9px" }}>View All →</Link>}
        </div>
        {analyses.length===0 ? (
          <div className="card p-8 text-center">
            <div className="w-14 h-14 rounded mx-auto mb-4 flex items-center justify-center text-2xl" style={{ background:"var(--surface-alt)", color:"var(--primary)" }}>◫</div>
            <h3 className="font-display text-base font-bold mb-2" style={{ color:"var(--text)" }}>Your Oracle Awaits</h3>
            <p className="text-sm mb-6 max-w-xs mx-auto leading-relaxed" style={{ color:"var(--muted)" }}>Upload your first conversation and discover the truth within every message.</p>
            <Link href="/analyze" className="btn btn-primary">Begin First Reading →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {analyses.slice(0,4).map((a,i)=>(
              <motion.div key={a.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.45+i*.05 }}>
                <AnalysisCard item={a}/>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
