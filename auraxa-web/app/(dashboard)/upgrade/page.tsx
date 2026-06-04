"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";

declare global {
  interface Window { Razorpay: any; }
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "forever",
    highlight: false,
    cta: "Current Plan",
    features: [
      "3 analyses / month",
      "Basic emotional insights",
      "Gen Z score cards",
      "Astrology from chat",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "₹299",
    period: "per month",
    highlight: true,
    cta: "Upgrade to Premium",
    features: [
      "20 analyses / month",
      "Full emotional intelligence report",
      "Birth chart compatibility",
      "Palm reading",
      "AI Advisor (50 messages)",
      "Priority processing",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹599",
    period: "per month",
    highlight: false,
    cta: "Go Pro",
    features: [
      "Unlimited analyses",
      "Everything in Premium",
      "Unlimited AI Advisor",
      "Relationship timeline export",
      "Download full reports",
      "Early access to new features",
    ],
  },
];

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  );
}

function SuccessModal({ plan, onClose }: { plan: string; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ opacity: 0, scale: .92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: .3, ease: [.16,1,.3,1] }}
        className="card p-8 text-center max-w-sm w-full">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "var(--pri-soft)" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h2 className="font-display text-xl font-bold mb-2" style={{ color: "var(--text)" }}>
          You're on {plan.charAt(0).toUpperCase() + plan.slice(1)}!
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Your account has been upgraded. All premium features are now unlocked.
        </p>
        <button onClick={onClose} className="btn btn-primary w-full">
          Start Analysing →
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function UpgradePage() {
  const router = useRouter();
  const [loading, setLoading]         = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState("free");
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  useEffect(() => {
    api.get("/api/subscriptions/status")
      .then(r => setCurrentTier(r.data.tier))
      .catch(() => {});
  }, []);

  const loadRazorpay = (): Promise<boolean> => {
    return new Promise(resolve => {
      if (window.Razorpay) { resolve(true); return; }
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload  = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === "free" || planId === currentTier) return;
    setLoading(planId);

    try {
      // Step 1 — load Razorpay script
      const loaded = await loadRazorpay();
      if (!loaded) { toast.error("Could not load payment gateway. Check your connection."); return; }

      // Step 2 — create order on backend
      const orderRes = await api.post("/api/subscriptions/create-order", { plan: planId });
      const { order_id, amount, currency, plan_name, key_id, prefill } = orderRes.data;

      // Step 3 — open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         key_id,
          amount:      amount,
          currency:    currency,
          name:        "Auraxa",
          description: plan_name,
          order_id:    order_id,
          prefill,
          theme:       { color: "#6c55e0" },
          modal: {
            ondismiss: () => reject(new Error("dismissed")),
          },
          handler: async (response: any) => {
            try {
              // Step 4 — verify on backend
              await api.post("/api/subscriptions/verify", {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              });
              setCurrentTier(planId);
              setShowSuccess(planId);
              resolve();
            } catch (e) {
              reject(e);
            }
          },
        });
        rzp.open();
      });

    } catch (e: any) {
      if (e?.message !== "dismissed") {
        toast.error(e?.response?.data?.detail || "Payment failed. Please try again.");
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="px-3 sm:px-5 md:px-8 py-4 md:py-8 max-w-4xl">

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <p className="label mb-3" style={{ fontSize: "9px", color: "var(--primary)" }}>Plans</p>
        <h1 className="font-display font-bold mb-2" style={{ fontSize: "clamp(1.5rem,5vw,2.2rem)", color: "var(--text)" }}>
          Choose Your Path
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Unlock deeper insights into your relationships.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {PLANS.map((plan, i) => {
          const isCurrent = plan.id === currentTier;
          const isLoading = loading === plan.id;
          return (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}>
              <div className="card p-5 h-full flex flex-col relative"
                style={plan.highlight ? { border: "2px solid var(--primary)", boxShadow: "var(--shadow-lg)" } : {}}>

                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded font-display font-bold"
                    style={{ background: "var(--primary)", color: "#fff", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    Most Popular
                  </span>
                )}

                {isCurrent && (
                  <span className="absolute -top-3 right-4 px-3 py-1 rounded font-mono font-bold"
                    style={{ background: "var(--green)", color: "#fff", fontSize: "9px" }}>
                    Current
                  </span>
                )}

                <p className="font-display font-bold text-lg mb-1" style={{ color: "var(--text)" }}>{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="font-display font-bold" style={{ fontSize: "1.875rem", color: "var(--text)" }}>{plan.price}</span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>/ {plan.period}</span>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex-shrink-0"><CheckIcon/></span>
                      <span className="text-sm" style={{ color: "var(--muted)" }}>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={plan.id === "free" || isCurrent || isLoading}
                  className={plan.highlight ? "btn btn-primary w-full" : "btn btn-secondary w-full"}
                  style={(plan.id === "free" || isCurrent) ? { opacity: 0.5, cursor: "default" } : {}}>
                  {isLoading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    : isCurrent ? "Current Plan" : plan.cta}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-6 flex-wrap">
        {[
          { icon: "🔒", text: "Secured by Razorpay" },
          { icon: "↩", text: "Cancel anytime" },
          { icon: "🇮🇳", text: "₹ Indian pricing" },
        ].map(b => (
          <div key={b.text} className="flex items-center gap-2">
            <span style={{ fontSize: "14px" }}>{b.icon}</span>
            <span className="label" style={{ fontSize: "9px" }}>{b.text}</span>
          </div>
        ))}
      </div>

      {/* Success modal */}
      <AnimatePresence>
        {showSuccess && (
          <SuccessModal
            plan={showSuccess}
            onClose={() => { setShowSuccess(null); router.push("/dashboard"); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
