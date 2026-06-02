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
  analyses_used_month: number; advisor_msgs_used_month: number; created_at: string;
}

function getGreeting(name: string) {
  const h = new Date().getHours();
  if (h < 5)  return `Still awake, ${name}`;
  if (h < 12) return `Good morning, ${name}`;
  if (h < 17) return `Good afternoon, ${name}`;
  if (h < 21) return `Good evening, ${name}`;
  return `Good night, ${name}`;
}

const QUICK_ACTIONS = [
  { href: "/analyze",   icon: "◫", label: "New Analysis", desc: "Paste or upload" },
  { href: "/astrology", icon: "◈", label: "Astrology",    desc: "Stars & palm" },
  { href: "/reports",   icon: "▤", label: "All Reports",  desc: "Past analyses" },
  { href: "/profile",   icon: "◇", label: "Profile",      desc: "Your details" },
];

const SCORE_COLORS: Record<string, string> = { low: "#3457d5", medium: "#5c5e62", high: "#cc0000", critical: "#cc0000" };

function CosmicEnergyWidget({ insight }: { insight: DailyInsight }) {
  return (
    <div className="card p-5 h-full">
      <p className="label mb-3">Daily Cosmic Energy</p>
      <div className="flex items-end gap-3 mb-3">
        <span className="font-display text-4xl font-bold" style={{ color: "#171a20" }}>{insight.energy_level}</span>
        <span className="text-lg mb-1" style={{ color: "#3457d5" }}>{insight.energy_label}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "var(--surface-alt)" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${insight.energy_level}%` }} transition={{ duration: 1.4, delay: 0.3 }}
          className="h-full rounded-full" style={{ background: "#3457d5" }} />
      </div>
      <p className="text-sm leading-relaxed mb-3" style={{ color: "#5c5e62" }}>{insight.energy_note}</p>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: "rgba(52,87,213,.08)", color: "#3457d5", border: "1px solid rgba(52,87,213,.18)" }}>{insight.dominant_element}</span>
        <span className="text-[10px] font-mono" style={{ color: "#5c5e62" }}>◦ {insight.moon_phase}</span>
        <span className="text-[10px] font-mono" style={{ color: "#5c5e62" }}>◦ Peak {insight.power_hour}</span>
      </div>
    </div>
  );
}

function DailyInsightWidget({ insight }: { insight: DailyInsight }) {
  return (
    <div className="card p-5 h-full flex flex-col gap-4">
      <p className="label">Today's Insight</p>
      <div className="flex gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5" style={{ color: "#3457d5" }}>◈</span>
        <p className="text-sm leading-relaxed" style={{ color: "#171a20" }}>{insight.insight}</p>
      </div>
      <div className="flex gap-3 pt-1" style={{ borderTop: "1px solid var(--line)" }}>
        <span className="text-xl flex-shrink-0 mt-2.5" style={{ color: "#5c5e62" }}>◇</span>
        <p className="text-sm leading-relaxed mt-2" style={{ color: "#5c5e62" }}>{insight.guidance}</p>
      </div>
    </div>
  );
}

function InsightSkeleton() {
  return (
    <div className="card p-5 h-full">
      <div className="shimmer h-3 w-32 rounded mb-4" />
      <div className="shimmer h-8 w-16 rounded mb-3" />
      <div className="shimmer h-1.5 w-full rounded mb-3" />
      <div className="shimmer h-3 w-3/4 rounded" />
    </div>
  );
}

function AnalysisCard({ item }: { item: Analysis }) {
  const scores = item.scores;
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.25 }}>
      <Link href={`/results/${item.id}`}>
        <div className="card card-hover p-5 cursor-pointer group">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-display text-sm font-semibold" style={{ color: "#171a20" }}>
                {item.speakers?.a ?? "You"} & {item.speakers?.b ?? "Them"}
              </p>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: "#5c5e62" }}>
                {new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                {item.message_count ? ` · ${item.message_count} msgs` : ""}
              </p>
            </div>
            {item.status === "completed" && scores ? (
              <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: "var(--surface-alt)" }}>
                <span className="font-display text-sm font-bold" style={{ color: "#171a20" }}>{scores.overall_score}</span>
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
              {scores?.patterns_detected?.slice(0, 3).map((p: string) => (
                <span key={p} className="px-2 py-0.5 rounded text-[10px]" style={{ background: "var(--surface-alt)", color: "#5c5e62" }}>{p}</span>
              ))}
            </div>
          )}
          <p className="text-[11px] text-right mt-3 transition-colors" style={{ color: "#3457d5" }}>View Report →</p>
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="card p-12 text-center">
      <div className="w-20 h-20 rounded mx-auto mb-6 flex items-center justify-center" style={{ background: "var(--surface-alt)" }}>
        <span className="text-3xl" style={{ color: "#3457d5" }}>◫</span>
      </div>
      <h3 className="font-display text-lg font-semibold mb-2" style={{ color: "#171a20" }}>Your Oracle Awaits</h3>
      <p className="mb-8 max-w-sm mx-auto leading-relaxed" style={{ color: "#5c5e62" }}>
        Upload your first conversation and discover the emotional intelligence hidden within every message.
      </p>
      <Link href="/analyze" className="btn btn-primary">Begin First Reading →</Link>
    </div>
  );
}

function UsageWidget({ profile }: { profile: UserProfile }) {
  const tier = profile.subscription_tier;
  const used = profile.analyses_used_month;
  const limit = tier === "pro" ? 9999 : tier === "premium" ? 20 : 3;
  const pct = limit >= 9999 ? 3 : Math.min((used / limit) * 100, 100);
  const full = used >= limit && limit < 9999;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="label">Usage This Month</p>
        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold capitalize" style={{ background: "var(--surface-alt)", color: "#171a20" }}>{tier}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="font-display text-2xl font-bold" style={{ color: "#171a20" }}>{used}</span>
        <span className="text-sm" style={{ color: "#5c5e62" }}>/ {limit >= 9999 ? "∞" : limit}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "var(--surface-alt)" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.5 }}
          className="h-full rounded-full" style={{ background: full ? "#cc0000" : "#3457d5" }} />
      </div>
      {full ? <Link href="/upgrade" className="text-[11px]" style={{ color: "#cc0000" }}>Limit reached — upgrade →</Link>
        : tier === "free" ? <Link href="/upgrade" className="text-[11px]" style={{ color: "#3457d5" }}>Unlock unlimited →</Link> : null}
    </div>
  );
}

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [a, p] = await Promise.all([api.get("/api/analyze"), api.get("/api/users/me")]);
      setAnalyses(a.data?.analyses ?? a.data ?? []);
      setProfile(p.data);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); }
  }, []);

  const loadInsight = useCallback(async () => {
    try { const res = await api.get("/api/daily-insight"); setInsight(res.data); }
    catch {
      setInsight({ energy_level: 72, energy_label: "Luminous", energy_note: "Clear perception today. Trust what you feel.",
        insight: "The stars align for emotional clarity and honest connection.", guidance: "Speak your truth with kindness.",
        dominant_element: "Air", moon_phase: "Waxing Gibbous", power_hour: "7–9 PM" });
    } finally { setInsightLoading(false); }
  }, []);

  useEffect(() => { loadData(); loadInsight(); }, [loadData, loadInsight]);

  const firstName = profile?.name?.split(" ")[0] ?? "Seeker";

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 animate-spin" style={{ borderColor: "var(--line)", borderTopColor: "#3457d5" }} />
          <p className="label">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="label mb-1">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="font-display text-2xl md:text-3xl font-bold" style={{ color: "#171a20" }}>{getGreeting(firstName)}</h1>
          </div>
          <Link href="/analyze" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: "12px" }}>New Reading +</Link>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {insightLoading ? <InsightSkeleton /> : insight ? <CosmicEnergyWidget insight={insight} /> : null}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          {insightLoading ? <InsightSkeleton /> : insight ? <DailyInsightWidget insight={insight} /> : null}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {QUICK_ACTIONS.map(a => (
          <Link key={a.href} href={a.href}>
            <div className="card card-hover p-4 text-center group cursor-pointer">
              <div className="w-10 h-10 rounded mx-auto mb-2.5 flex items-center justify-center text-lg transition-all group-hover:scale-105"
                style={{ background: "var(--surface-alt)" }}>
                <span style={{ color: "#3457d5" }}>{a.icon}</span>
              </div>
              <p className="font-display text-xs font-semibold" style={{ color: "#171a20" }}>{a.label}</p>
              <p className="text-[9px] mt-0.5" style={{ color: "#5c5e62" }}>{a.desc}</p>
            </div>
          </Link>
        ))}
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {profile && <UsageWidget profile={profile} />}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-semibold" style={{ color: "#171a20" }}>Recent Readings</h2>
          {analyses.length > 0 && <Link href="/reports" className="label hover:text-text transition-colors">View All →</Link>}
        </div>
        {analyses.length === 0 ? <EmptyState /> : (
          <div className="grid md:grid-cols-2 gap-4">
            {analyses.slice(0, 4).map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 + i * 0.06 }}>
                <AnalysisCard item={a} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
