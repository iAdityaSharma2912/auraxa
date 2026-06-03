"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { toast } from "sonner";

type Tab = "overview" | "tokens" | "users" | "analyses" | "health";

interface Stats {
  users: { total: number; new_week: number; tiers: Record<string, number> };
  analyses: { total: number; completed: number; failed: number; processing: number; new_week: number; new_month: number; success_rate: number; daily: { date: string; count: number }[] };
  tokens: { total_input: number; total_output: number; total: number; total_cost_usd: number; week_tokens: number; week_cost_usd: number; avg_per_analysis: number; model: string; note: string };
}
interface Health {
  overall: string;
  services: Record<string, { status: string; latency_ms?: number; version?: string; memory?: string; queue_length?: number; error?: string }>;
  checked_at: string;
}
interface AdminUser { id: string; name: string; email: string; subscription_tier: string; analyses_count: number; tokens_used: number; cost_usd: number; created_at: string }
interface AdminAnalysis { id: string; status: string; speakers: { a?: string; b?: string }; message_count?: number; created_at: string; user_email: string; tokens: number; cost_usd: number }

const STATUS_COLOR: Record<string, string> = { completed: "var(--green)", failed: "var(--red)", processing: "var(--amber)", queued: "var(--muted)" };
const TIER_COLOR: Record<string, string>   = { pro: "var(--primary)", premium: "#047857", free: "var(--muted)" };

function fmt(n: number) { return n >= 1_000_000 ? `${(n/1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n/1_000).toFixed(1)}k` : String(n); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }); }
function fmtTime(d: string) { return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }

// ─── Sparkline ───────────────────────────────────────────
function Sparkline({ data }: { data: { date: string; count: number }[] }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const w = 100 / data.length;
  return (
    <div className="flex items-end gap-0.5 h-10 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 group relative" style={{ height: "100%" }}>
          <motion.div className="absolute bottom-0 left-0 right-0 rounded-t"
            style={{ background: "var(--primary)", opacity: 0.7 }}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 2)}%` }}
            transition={{ delay: i * 0.03, duration: 0.4 }}>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10"
              style={{ background: "var(--text)", color: "#fff", borderRadius: "4px", padding: "2px 6px", fontSize: "9px", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
              {d.count} · {d.date}
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon }: { label: string; value: string | number; sub?: string; accent?: boolean; icon?: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="label" style={{ fontSize: "9px", color: accent ? "var(--primary)" : "var(--muted)" }}>{label}</p>
        {icon && <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "var(--surface-alt)" }}>{icon}</div>}
      </div>
      <p className="font-display font-bold" style={{ fontSize: "clamp(1.4rem,3.5vw,1.875rem)", color: accent ? "var(--primary)" : "var(--text)", lineHeight: 1 }}>{value}</p>
      {sub && <p className="label mt-1.5" style={{ fontSize: "9px" }}>{sub}</p>}
    </motion.div>
  );
}

// ─── Health Badge ─────────────────────────────────────────
function HealthBadge({ status }: { status: string }) {
  const c = status === "ok" ? "var(--green)" : status === "degraded" ? "var(--amber)" : "var(--red)";
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono font-bold" style={{ background: `${c}18`, color: c, fontSize: "10px" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
      {status.toUpperCase()}
    </span>
  );
}

export default function AdminPage() {
  const [tab, setTab]           = useState<Tab>("overview");
  const [stats, setStats]       = useState<Stats | null>(null);
  const [health, setHealth]     = useState<Health | null>(null);
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [analyses, setAnalyses] = useState<AdminAnalysis[]>([]);
  const [loading, setLoading]   = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try { const r = await api.get("/api/admin/stats"); setStats(r.data); }
    catch (e: any) { if (e?.response?.status === 403) setForbidden(true); }
    finally { setLoading(false); }
  }, []);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    try { const r = await api.get("/api/admin/health"); setHealth(r.data); }
    catch {}
    finally { setHealthLoading(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => {
    if (tab === "users"    && users.length === 0)    api.get("/api/admin/users").then(r => setUsers(r.data.users)).catch(() => {});
    if (tab === "analyses" && analyses.length === 0) api.get("/api/admin/analyses").then(r => setAnalyses(r.data.analyses)).catch(() => {});
    if (tab === "health"   && !health)               loadHealth();
  }, [tab]);

  const deleteAnalysis = async (id: string) => {
    if (!confirm("Delete permanently?")) return;
    setDeleting(id);
    try { await api.delete(`/api/admin/analyses/${id}`); setAnalyses(prev => prev.filter(a => a.id !== id)); toast.success("Deleted."); }
    catch { toast.error("Delete failed."); }
    finally { setDeleting(null); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[80vh]"><div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "var(--line-2)", borderTopColor: "var(--primary)" }}/></div>;
  if (forbidden) return <div className="flex items-center justify-center min-h-[80vh]"><div className="card p-10 text-center max-w-sm"><p className="font-display font-bold text-lg mb-2" style={{ color: "var(--text)" }}>Access Denied</p><p style={{ color: "var(--muted)" }}>Admin only.</p></div></div>;

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview",  label: "Overview" },
    { id: "tokens",    label: "Tokens & Cost" },
    { id: "users",     label: "Users" },
    { id: "analyses",  label: "Analyses" },
    { id: "health",    label: "System Health" },
  ];

  const s = stats;

  return (
    <div className="px-3 sm:px-5 md:px-8 py-4 md:py-8 max-w-6xl">

      {/* Header */}
      <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="label mb-1" style={{ fontSize: "9px", color: "var(--primary)" }}>Admin</p>
          <h1 className="font-display font-bold" style={{ fontSize: "clamp(1.3rem,5vw,1.875rem)", color: "var(--text)" }}>Control Panel</h1>
        </div>
        <button onClick={() => { loadStats(); toast.success("Refreshed."); }}
          className="btn btn-secondary" style={{ fontSize: "11px", padding: "8px 14px" }}>
          Refresh ↺
        </button>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="flex gap-1 p-1 rounded mb-6 overflow-x-auto no-scrollbar" style={{ background: "var(--surface-alt)", width: "fit-content", maxWidth: "100%" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-3 sm:px-4 py-2 rounded font-display font-bold whitespace-nowrap transition-all"
            style={{ fontSize: "clamp(10px,2.5vw,12px)", ...(t.id === tab ? { background: "var(--bg)", color: "var(--text)", boxShadow: "var(--shadow-sm)" } : { color: "var(--muted)" }) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && s && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Top stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Users"    value={s.users.total}            sub={`+${s.users.new_week} this week`}    accent />
            <StatCard label="Total Analyses" value={s.analyses.total}         sub={`+${s.analyses.new_week} this week`} />
            <StatCard label="Success Rate"   value={`${s.analyses.success_rate}%`} sub={`${s.analyses.completed} completed`} />
            <StatCard label="Est. AI Cost"   value={`$${s.tokens.total_cost_usd}`} sub={`$${s.tokens.week_cost_usd} this week`} />
          </div>

          {/* Activity sparkline */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="label" style={{ fontSize: "9px" }}>Analyses — Last 14 Days</p>
              <span className="font-display font-bold text-sm" style={{ color: "var(--primary)" }}>{s.analyses.new_week} this week</span>
            </div>
            <Sparkline data={s.analyses.daily}/>
            <div className="flex justify-between mt-2">
              <span className="label" style={{ fontSize: "8px" }}>{s.analyses.daily[0]?.date}</span>
              <span className="label" style={{ fontSize: "8px" }}>Today</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subscription breakdown */}
            <div className="card p-5">
              <p className="label mb-4" style={{ fontSize: "9px" }}>Subscription Tiers</p>
              {Object.entries(s.users.tiers).map(([tier, count]) => (
                <div key={tier} className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: TIER_COLOR[tier] ?? "var(--muted)" }}/>
                      <span className="font-display font-bold text-xs capitalize" style={{ color: "var(--text)" }}>{tier}</span>
                    </div>
                    <span className="label" style={{ fontSize: "9px" }}>{count} users</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-alt)" }}>
                    <motion.div className="h-full rounded-full" style={{ background: TIER_COLOR[tier] ?? "var(--muted)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${s.users.total ? (count / s.users.total) * 100 : 0}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Analysis status */}
            <div className="card p-5">
              <p className="label mb-4" style={{ fontSize: "9px" }}>Analysis Status</p>
              {[
                { label: "Completed", value: s.analyses.completed, color: "var(--green)" },
                { label: "Failed",    value: s.analyses.failed,    color: "var(--red)" },
                { label: "Processing", value: s.analyses.processing, color: "var(--amber)" },
              ].map(row => (
                <div key={row.label} className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-display font-bold text-xs" style={{ color: row.color }}>{row.label}</span>
                    <span className="label" style={{ fontSize: "9px" }}>{row.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-alt)" }}>
                    <motion.div className="h-full rounded-full" style={{ background: row.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${s.analyses.total ? (row.value / s.analyses.total) * 100 : 0}%` }}
                      transition={{ duration: 0.8 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── TOKENS ── */}
      {tab === "tokens" && s && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Tokens"       value={fmt(s.tokens.total)}            sub="All time"           accent />
            <StatCard label="Input Tokens"        value={fmt(s.tokens.total_input)}      sub="Context + messages" />
            <StatCard label="Output Tokens"       value={fmt(s.tokens.total_output)}     sub="AI responses" />
            <StatCard label="Avg Per Analysis"    value={fmt(s.tokens.avg_per_analysis)} sub="Combined in+out" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Total AI Cost"       value={`$${s.tokens.total_cost_usd}`} sub="All time USD" accent />
            <StatCard label="This Week Cost"      value={`$${s.tokens.week_cost_usd}`}  sub={`${fmt(s.tokens.week_tokens)} tokens`} />
            <StatCard label="Per Analysis Cost"   value={`$${((s.tokens.total_cost_usd / s.analyses.completed) || 0).toFixed(4)}`} sub="Average per run" />
          </div>

          {/* Pricing breakdown */}
          <div className="card p-5">
            <p className="label mb-4" style={{ fontSize: "9px" }}>Pricing Breakdown</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-bold font-display mb-3" style={{ color: "var(--text)" }}>Input Tokens</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
                    <span>Total input tokens</span><span className="font-mono">{fmt(s.tokens.total_input)}</span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
                    <span>Rate (per 1M)</span><span className="font-mono">$0.15</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold" style={{ color: "var(--text)" }}>
                    <span>Input cost</span>
                    <span className="font-mono">${((s.tokens.total_input / 1_000_000) * 0.15).toFixed(4)}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold font-display mb-3" style={{ color: "var(--text)" }}>Output Tokens</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
                    <span>Total output tokens</span><span className="font-mono">{fmt(s.tokens.total_output)}</span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
                    <span>Rate (per 1M)</span><span className="font-mono">$0.60</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold" style={{ color: "var(--text)" }}>
                    <span>Output cost</span>
                    <span className="font-mono">${((s.tokens.total_output / 1_000_000) * 0.60).toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--line)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-sm" style={{ color: "var(--text)" }}>Total Cost</p>
                  <p className="label mt-0.5" style={{ fontSize: "9px" }}>Model: {s.tokens.model}</p>
                </div>
                <p className="font-display font-bold text-2xl" style={{ color: "var(--primary)" }}>${s.tokens.total_cost_usd}</p>
              </div>
              <p className="label mt-2" style={{ fontSize: "9px", color: "var(--amber)" }}>⚠ {s.tokens.note}</p>
            </div>
          </div>

          {/* Token bar */}
          <div className="card p-5">
            <p className="label mb-3" style={{ fontSize: "9px" }}>Input vs Output Split</p>
            <div className="h-4 rounded-full overflow-hidden flex" style={{ background: "var(--surface-alt)" }}>
              <motion.div className="h-full rounded-l-full" style={{ background: "var(--primary)" }}
                initial={{ width: 0 }}
                animate={{ width: `${s.tokens.total ? (s.tokens.total_input / s.tokens.total) * 100 : 70}%` }}
                transition={{ duration: 1 }}/>
              <motion.div className="h-full" style={{ background: "#9b8cf0", flex: 1 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}/>
            </div>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "var(--primary)" }}/><span className="label" style={{ fontSize: "9px" }}>Input ({s.tokens.total ? Math.round(s.tokens.total_input/s.tokens.total*100) : 0}%)</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "#9b8cf0" }}/><span className="label" style={{ fontSize: "9px" }}>Output ({s.tokens.total ? Math.round(s.tokens.total_output/s.tokens.total*100) : 0}%)</span></div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── USERS ── */}
      {tab === "users" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="label mb-3" style={{ fontSize: "9px" }}>{users.length} users</p>
          <div className="card overflow-hidden overflow-x-auto">
            <table className="w-full" style={{ minWidth: "640px" }}>
              <thead>
                <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
                  {["Name", "Email", "Plan", "Analyses", "Tokens Used", "Est. Cost", "Joined"].map(h => (
                    <th key={h} className="label text-left px-4 py-2.5" style={{ fontSize: "8px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-6 text-center"><div className="card h-6 shimmer"/></td></tr>
                ) : users.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: i < users.length-1 ? "1px solid var(--line)" : "none", background: i%2 === 0 ? "var(--bg)" : "var(--surface)" }}>
                    <td className="px-4 py-3 text-xs font-bold font-display" style={{ color: "var(--text)" }}>{u.name || "—"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold capitalize"
                        style={{ background: u.subscription_tier === "pro" ? "var(--primary)" : "var(--surface-alt)", color: u.subscription_tier === "pro" ? "#fff" : "var(--text)" }}>
                        {u.subscription_tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-display font-bold text-center" style={{ color: "var(--text)" }}>{u.analyses_count}</td>
                    <td className="px-4 py-3 text-[10px] font-mono" style={{ color: "var(--primary)" }}>{fmt(u.tokens_used)}</td>
                    <td className="px-4 py-3 text-[10px] font-mono" style={{ color: "var(--amber)" }}>${u.cost_usd}</td>
                    <td className="px-4 py-3 text-[10px] font-mono" style={{ color: "var(--muted-2)" }}>{fmtDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── ANALYSES ── */}
      {tab === "analyses" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="label mb-3" style={{ fontSize: "9px" }}>{analyses.length} most recent</p>
          <div className="card overflow-hidden overflow-x-auto">
            <table className="w-full" style={{ minWidth: "740px" }}>
              <thead>
                <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
                  {["Speakers", "User", "Status", "Msgs", "Tokens", "Cost", "Date", ""].map(h => (
                    <th key={h} className="label text-left px-4 py-2.5" style={{ fontSize: "8px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analyses.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-6"><div className="card h-6 shimmer"/></td></tr>
                ) : analyses.map((a, i) => (
                  <tr key={a.id} style={{ borderBottom: i < analyses.length-1 ? "1px solid var(--line)" : "none", background: i%2===0 ? "var(--bg)" : "var(--surface)" }}>
                    <td className="px-4 py-3 text-xs font-bold font-display" style={{ color: "var(--text)" }}>{a.speakers?.a ?? "?"} & {a.speakers?.b ?? "?"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{a.user_email}</td>
                    <td className="px-4 py-3 text-[9px] font-mono font-bold capitalize" style={{ color: STATUS_COLOR[a.status] ?? "var(--muted)" }}>{a.status}</td>
                    <td className="px-4 py-3 text-[10px] font-mono" style={{ color: "var(--muted-2)" }}>{a.message_count ?? "—"}</td>
                    <td className="px-4 py-3 text-[10px] font-mono" style={{ color: "var(--primary)" }}>{fmt(a.tokens)}</td>
                    <td className="px-4 py-3 text-[10px] font-mono" style={{ color: "var(--amber)" }}>${a.cost_usd}</td>
                    <td className="px-4 py-3 text-[10px] font-mono" style={{ color: "var(--muted-2)" }}>{fmtTime(a.created_at)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteAnalysis(a.id)} disabled={deleting === a.id}
                        className="w-7 h-7 rounded flex items-center justify-center"
                        style={{ background: "var(--red-soft)", border: "1px solid rgba(204,0,0,.2)" }}>
                        {deleting === a.id
                          ? <div className="w-3 h-3 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"/>
                          : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── HEALTH ── */}
      {tab === "health" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="label" style={{ fontSize: "9px" }}>System Status</p>
              {health && <HealthBadge status={health.overall}/>}
            </div>
            <button onClick={loadHealth} disabled={healthLoading} className="btn btn-secondary" style={{ fontSize: "11px", padding: "8px 14px" }}>
              {healthLoading ? <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin"/> : "Refresh ↺"}
            </button>
          </div>

          {!health ? (
            <div className="card p-8 text-center"><p className="label">Loading health data...</p></div>
          ) : (
            <>
              {/* Service cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(health.services).map(([svc, info]) => (
                  <div key={svc} className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-display font-bold text-sm capitalize" style={{ color: "var(--text)" }}>{svc}</p>
                      <HealthBadge status={info.status}/>
                    </div>
                    <div className="space-y-1.5">
                      {info.latency_ms !== undefined && info.latency_ms !== null && (
                        <div className="flex justify-between text-xs">
                          <span style={{ color: "var(--muted)" }}>Latency</span>
                          <span className="font-mono" style={{ color: "var(--text)" }}>{info.latency_ms}ms</span>
                        </div>
                      )}
                      {info.version && (
                        <div className="flex justify-between text-xs">
                          <span style={{ color: "var(--muted)" }}>Version</span>
                          <span className="font-mono" style={{ color: "var(--text)" }}>{info.version}</span>
                        </div>
                      )}
                      {info.memory && (
                        <div className="flex justify-between text-xs">
                          <span style={{ color: "var(--muted)" }}>Memory</span>
                          <span className="font-mono" style={{ color: "var(--text)" }}>{info.memory}</span>
                        </div>
                      )}
                      {info.queue_length !== undefined && (
                        <div className="flex justify-between text-xs">
                          <span style={{ color: "var(--muted)" }}>Queue</span>
                          <span className="font-mono" style={{ color: info.queue_length > 10 ? "var(--amber)" : "var(--text)" }}>{info.queue_length} jobs</span>
                        </div>
                      )}
                      {info.error && (
                        <p className="text-[10px]" style={{ color: "var(--red)" }}>{info.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="card p-4">
                <p className="label mb-1" style={{ fontSize: "9px" }}>Last checked</p>
                <p className="text-sm font-mono" style={{ color: "var(--muted)" }}>{fmtTime(health.checked_at)}</p>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
