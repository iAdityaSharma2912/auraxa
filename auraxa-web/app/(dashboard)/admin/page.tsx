"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import api from "@/lib/api";

function ProviderStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; dot: string }> = {
    healthy:  { label: "Healthy",  color: "text-green-400 border-green-500/20 bg-green-500/10",  dot: "bg-green-400" },
    degraded: { label: "Degraded", color: "text-amber-400 border-amber-500/20 bg-amber-500/10",  dot: "bg-amber-400" },
    down:     { label: "Down",     color: "text-red-400 border-red-500/20 bg-red-500/10",         dot: "bg-red-400"   },
    unknown:  { label: "No Data",  color: "text-white/30 border-white/[0.08] bg-white/[0.04]",   dot: "bg-white/20"  },
  };
  const c = config[status] ?? config.unknown;
  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-lg border ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

const PROVIDER_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  openrouter: { label: "OpenRouter",   icon: "◈", color: "text-violet-300" },
  gemini:     { label: "Google Gemini",icon: "⬡", color: "text-blue-300"   },
  nvidia:     { label: "NVIDIA NIM",   icon: "⬟", color: "text-green-300"  },
};

export default function AdminPage() {
  const [stats,     setStats]     = useState<any>(null);
  const [providers, setProviders] = useState<any>(null);
  const [loading,   setLoading]   = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, provRes] = await Promise.all([
        api.get("/api/admin/stats").catch(() => null),
        api.get("/api/admin/providers"),
      ]);
      if (statsRes) setStats(statsRes.data);
      setProviders(provRes.data);
    } catch (err: any) {
      if (err?.response?.status === 403) toast.error("Admin access required.");
      else toast.error("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSetTier = async (userId: string, tier: string) => {
    try {
      await api.post(`/api/admin/users/${userId}/set-tier`, { tier });
      toast.success(`Upgraded to ${tier}.`);
      fetchAll();
    } catch { toast.error("Failed."); }
  };

  const handleResetUsage = async (userId: string) => {
    try {
      await api.post(`/api/admin/users/${userId}/reset-usage`);
      toast.success("Usage reset.");
      fetchAll();
    } catch { toast.error("Failed."); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-8 py-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-[10px] text-red-400/60 uppercase tracking-widest mb-2">Admin Only</p>
          <h1 className="font-syne text-3xl font-800 tracking-tight">Dashboard</h1>
        </div>
        <button onClick={fetchAll} className="px-4 py-2 glass rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors">
          Refresh ↺
        </button>
      </motion.div>

      {/* ── AI Provider Health ── */}
      {providers && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-syne font-600 text-sm">AI Provider Health</p>
            <p className="text-[11px] font-mono text-white/20">
              Priority: {providers.priority_order?.join(" → ")}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {providers.priority_order?.map((name: string, idx: number) => {
              const p = providers.providers?.[name];
              const meta = PROVIDER_LABELS[name] ?? { label: name, icon: "◆", color: "text-white/60" };
              return (
                <div key={name} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-base ${meta.color}`}>{meta.icon}</span>
                      <span className="font-syne font-600 text-sm">{meta.label}</span>
                      {idx === 0 && (
                        <span className="text-[9px] font-mono text-violet-400/60 border border-violet-500/20 px-1.5 py-0.5 rounded-md">PRIMARY</span>
                      )}
                    </div>
                    <ProviderStatusBadge status={p?.status ?? "unknown"} />
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-white/30">Analysis model</span>
                      <span className="font-mono text-white/50 truncate max-w-[120px]">{p?.model_analysis ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/30">Successes</span>
                      <span className="font-mono text-green-400/70">{p?.success_count ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/30">Failures</span>
                      <span className={`font-mono ${(p?.failure_count ?? 0) > 0 ? "text-red-400/70" : "text-white/30"}`}>
                        {p?.failure_count ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/30">Avg latency</span>
                      <span className="font-mono text-white/40">
                        {p?.avg_latency_ms ? `${p.avg_latency_ms}ms` : "—"}
                      </span>
                    </div>
                    {p?.last_error && (
                      <div className="mt-2 pt-2 border-t border-white/[0.05]">
                        <p className="text-red-400/60 truncate">✗ {p.last_error}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-white/20 mt-3">
            If the primary provider fails, Auraxa automatically switches to the next one. Zero downtime.
          </p>
        </motion.div>
      )}

      {stats && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Users",    value: stats.users.total,            color: "text-violet-300" },
              { label: "Total Analyses", value: stats.analyses.total,         color: "text-teal-300"   },
              { label: "Completed",      value: stats.analyses.completed,     color: "text-green-400"  },
              { label: "Success Rate",   value: `${stats.analyses.success_rate}%`, color: "text-amber-300" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-2xl p-5 text-center">
                <p className={`font-syne font-black text-2xl ${s.color}`}>{s.value}</p>
                <p className="text-xs text-white/30 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Tier breakdown */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6 mb-6">
            <p className="font-syne font-600 text-sm mb-4">Users by Tier</p>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(stats.users.by_tier).map(([tier, count]: [string, any]) => (
                <div key={tier} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="font-syne font-700 text-xl text-white/70">{count}</p>
                  <p className="text-xs text-white/30 capitalize mt-0.5">{tier}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Promo codes */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl p-6 mb-6">
            <p className="font-syne font-600 text-sm mb-4">Active Promo Codes</p>
            <div className="flex flex-wrap gap-2">
              {stats.promo_codes.map((code: string) => (
                <span key={code} className="font-mono text-sm px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300">
                  {code}
                </span>
              ))}
            </div>
            <p className="text-xs text-white/20 mt-3">Manage in PROMO_CODES env var. Rebuild to apply changes.</p>
          </motion.div>

          {/* Recent users */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <p className="font-syne font-600 text-sm">Recent Users</p>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {stats.recent_users.map((user: any) => (
                <div key={user.id} className="px-6 py-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70 font-medium truncate">{user.name ?? "—"}</p>
                    <p className="text-xs text-white/30 truncate">{user.email}</p>
                    {user.promo_codes_used?.length > 0 && (
                      <p className="text-[10px] text-violet-400/50 font-mono mt-0.5">
                        Promo: {user.promo_codes_used.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-mono px-2 py-1 rounded-lg capitalize ${
                      user.tier === "pro" ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" :
                      user.tier === "premium" ? "bg-violet-500/10 text-violet-300 border border-violet-500/20" :
                      "bg-white/[0.04] text-white/30 border border-white/[0.06]"
                    }`}>{user.tier}</span>
                    <span className="text-xs text-white/25 font-mono">{user.analyses_used} used</span>
                    <select
                      defaultValue={user.tier}
                      onChange={(e) => handleSetTier(user.id, e.target.value)}
                      className="text-[11px] font-mono bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-white/40 focus:outline-none cursor-pointer"
                    >
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                      <option value="pro">Pro</option>
                    </select>
                    <button onClick={() => handleResetUsage(user.id)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/25 hover:text-white/60 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent analyses */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <p className="font-syne font-600 text-sm">Recent Analyses</p>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {stats.recent_analyses.map((a: any) => (
                <div key={a.id} className="px-6 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-white/30 truncate">{a.id}</p>
                    <p className="text-xs text-white/25 mt-0.5">{a.message_count} messages · {a.intent}</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-1 rounded-lg ${
                    a.status === "completed" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                    a.status === "failed"    ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                    "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>{a.status}</span>
                  <p className="text-[10px] text-white/20 font-mono flex-shrink-0">
                    {new Date(a.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
