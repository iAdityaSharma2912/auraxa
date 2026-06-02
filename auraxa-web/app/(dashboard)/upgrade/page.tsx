"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import api from "@/lib/api";

const PLANS = [
  {
    id: "free", name: "Free", price: "₹0", period: "forever",
    features: ["3 analyses per month", "Basic emotional insights", "Astrology from chat", "Community support"],
    cta: "Current Plan", highlight: false,
  },
  {
    id: "premium", name: "Premium", price: "₹299", period: "per month",
    features: ["20 analyses per month", "Full emotional intelligence", "Birth chart compatibility", "Palm reading", "AI Advisor (50 msgs)", "Priority processing"],
    cta: "Upgrade to Premium", highlight: true,
  },
  {
    id: "pro", name: "Pro", price: "₹599", period: "per month",
    features: ["Unlimited analyses", "Everything in Premium", "Unlimited AI Advisor", "Relationship timeline", "Export reports", "Early access features"],
    cta: "Go Pro", highlight: false,
  },
];

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (planId === "free") return;
    setLoading(planId);
    try {
      const res = await api.post("/api/subscriptions/create-order", { plan: planId });
      // Razorpay handoff would happen here
      toast.success("Redirecting to payment...");
      console.log("Order:", res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Could not start checkout.");
    } finally { setLoading(null); }
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
        <p className="label mb-2" style={{ color: "#3457d5" }}>Plans</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-3" style={{ color: "#171a20" }}>Choose Your Path</h1>
        <p style={{ color: "#5c5e62" }}>Unlock deeper insights into your relationships.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-5">
        {PLANS.map((plan, i) => (
          <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div className="card p-6 h-full flex flex-col relative"
              style={plan.highlight ? { border: "2px solid #3457d5", boxShadow: "var(--shadow-lg)" } : {}}>
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded text-[10px] font-mono font-semibold uppercase tracking-wider"
                  style={{ background: "#3457d5", color: "#fff" }}>Most Popular</span>
              )}
              <p className="font-display text-lg font-bold mb-1" style={{ color: "#171a20" }}>{plan.name}</p>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="font-display text-3xl font-bold" style={{ color: "#171a20" }}>{plan.price}</span>
                <span className="text-sm" style={{ color: "#5c5e62" }}>/ {plan.period}</span>
              </div>
              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex gap-2.5 text-sm" style={{ color: "#5c5e62" }}>
                    <span style={{ color: "#3457d5" }} className="flex-shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleUpgrade(plan.id)} disabled={plan.id === "free" || loading === plan.id}
                className={plan.highlight ? "btn btn-primary w-full" : "btn btn-secondary w-full"}
                style={plan.id === "free" ? { opacity: 0.5, cursor: "default" } : {}}>
                {loading === plan.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : plan.cta}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-center label mt-8">Secure payments via Razorpay · Cancel anytime</p>
    </div>
  );
}
