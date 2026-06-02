"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { getProfile } from "@/lib/api";
import { UserProfile } from "@/types";
import { toast } from "sonner";
import api from "@/lib/api";

const PLAN_CONFIG = {
  free:    { label: "Free",    color: "text-white/40",   analyses: 3,   advisor: 0   },
  premium: { label: "Premium", color: "text-violet-300", analyses: 20,  advisor: 50  },
  pro:     { label: "Pro",     color: "text-amber-300",  analyses: 9999, advisor: 9999 },
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState(false);

  const fetchProfile = () => {
    setLoading(true);
    getProfile()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) { toast.error("Enter a promo code."); return; }
    setPromoLoading(true);
    try {
      const { data } = await api.post("/api/promo/redeem", { code: promoCode.trim() });
      setPromoSuccess(true);
      setPromoCode("");
      toast.success(data.message);
      fetchProfile(); // Refresh to show new tier
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Invalid promo code.");
    } finally {
      setPromoLoading(false);
    }
  };

  const tier    = profile?.subscription_tier ?? "free";
  const plan    = PLAN_CONFIG[tier];
  const used    = profile?.analyses_used_month ?? 0;
  const usedAdv = profile?.advisor_msgs_used_month ?? 0;
  const limitA  = plan.analyses;
  const limitM  = plan.advisor;

  return (
    <div className="px-8 py-8 max-w-xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="font-mono text-[10px] text-violet-400/50 uppercase tracking-widest mb-2">Settings</p>
        <h1 className="font-syne text-3xl font-800 tracking-tight">Account</h1>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="glass rounded-2xl p-6 animate-pulse h-24" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Profile */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
            <p className="font-mono text-[10px] text-white/25 uppercase tracking-widest mb-4">Profile</p>
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center text-lg font-600 text-violet-300 flex-shrink-0">
                  {profile?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
              )}
              <div>
                <p className="font-syne font-600 text-base">{profile?.name ?? "—"}</p>
                <p className="text-sm text-white/35">{profile?.email ?? "—"}</p>
              </div>
            </div>
          </motion.div>

          {/* Promo Code — THE STAR OF PHASE 4 */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl p-6">
            <p className="font-mono text-[10px] text-white/25 uppercase tracking-widest mb-1">Promo Code</p>
            <p className="text-xs text-white/20 mb-4">Have a secret code? Enter it for instant Pro access.</p>

            {promoSuccess || tier === "pro" ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <span className="text-green-400 text-lg">✓</span>
                <div>
                  <p className="text-sm text-green-400 font-syne font-600">Pro Access Active</p>
                  <p className="text-xs text-white/30">You have unlimited analyses and all features unlocked.</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleRedeemPromo()}
                  placeholder="ENTER CODE"
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm font-mono text-white/80 placeholder-white/20 focus:outline-none focus:border-violet-500/40 tracking-widest uppercase"
                />
                <button
                  onClick={handleRedeemPromo}
                  disabled={promoLoading || !promoCode.trim()}
                  className="px-5 py-2.5 bg-violet-500/15 border border-violet-500/25 text-violet-300 text-sm font-syne font-600 rounded-xl hover:bg-violet-500/25 transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
                >
                  {promoLoading ? "..." : "Redeem →"}
                </button>
              </div>
            )}
          </motion.div>

          {/* Subscription */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
            <p className="font-mono text-[10px] text-white/25 uppercase tracking-widest mb-4">Subscription</p>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className={`font-syne font-800 text-xl ${plan.color}`}>{plan.label}</p>
                {profile?.subscription_expires_at && tier !== "free" && (
                  <p className="text-xs text-white/25 mt-0.5">
                    Renews {new Date(profile.subscription_expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                )}
              </div>
              {tier === "free" && (
                <a href="/upgrade" className="px-4 py-2 bg-violet-500/15 border border-violet-500/25 text-violet-300 text-sm rounded-xl hover:bg-violet-500/25 transition-all duration-200">
                  Upgrade →
                </a>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-white/35 mb-1.5">
                  <span>Analyses this month</span>
                  <span className="font-mono">{used} / {limitA >= 9999 ? "∞" : limitA}</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${limitA >= 9999 ? 5 : Math.min((used / limitA) * 100, 100)}%` }}
                    transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${used / limitA > 0.8 ? "bg-red-400/70" : "bg-violet-400/60"}`}
                  />
                </div>
              </div>

              {tier !== "free" && (
                <div>
                  <div className="flex justify-between text-xs text-white/35 mb-1.5">
                    <span>AI Advisor messages</span>
                    <span className="font-mono">{usedAdv} / {limitM >= 9999 ? "∞" : limitM}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${limitM >= 9999 ? 5 : Math.min((usedAdv / limitM) * 100, 100)}%` }}
                      transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-teal-400/60 rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Sign out */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="pt-2">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full py-3 border border-white/[0.07] hover:border-red-500/25 text-white/30 hover:text-red-400/70 text-sm rounded-xl transition-all duration-200"
            >
              Sign Out
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
