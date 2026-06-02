"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import api from "@/lib/api";

const PLANS = [
  { id:"free", name:"Free", price:"₹0", period:"forever",
    features:["3 analyses/month","Basic emotional insights","Astrology from chat","Community support"],
    cta:"Current Plan", highlight:false },
  { id:"premium", name:"Premium", price:"₹299", period:"per month",
    features:["20 analyses/month","Full emotional intelligence","Birth chart compatibility","Palm reading","AI Advisor (50 msgs)","Priority processing"],
    cta:"Upgrade to Premium", highlight:true },
  { id:"pro", name:"Pro", price:"₹599", period:"per month",
    features:["Unlimited analyses","Everything in Premium","Unlimited AI Advisor","Relationship timeline","Export reports","Early access"],
    cta:"Go Pro", highlight:false },
];

export default function UpgradePage() {
  const [loading, setLoading] = useState<string|null>(null);

  const upgrade = async (planId: string) => {
    if (planId==="free") return;
    setLoading(planId);
    try {
      await api.post("/api/subscriptions/create-order",{plan:planId});
      toast.success("Redirecting to payment...");
    } catch(e:any) { toast.error(e?.response?.data?.detail||"Could not start checkout."); }
    finally { setLoading(null); }
  };

  return (
    <div className="px-3 sm:px-5 md:px-8 py-4 md:py-8 max-w-4xl">
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="text-center mb-8">
        <p className="label mb-2" style={{ fontSize:"9px", color:"var(--primary)" }}>Plans</p>
        <h1 className="font-display font-bold mb-2" style={{ fontSize:"clamp(1.4rem,5vw,2rem)", color:"var(--text)" }}>Choose Your Path</h1>
        <p className="text-sm" style={{ color:"var(--muted)" }}>Unlock deeper insights into your relationships.</p>
      </motion.div>

      {/* Stacked on mobile, grid on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((plan,i)=>(
          <motion.div key={plan.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.08 }}>
            <div className="card p-5 h-full flex flex-col relative"
              style={plan.highlight?{border:"2px solid var(--primary)",boxShadow:"var(--shadow-lg)"}:{}}>
              {plan.highlight&&(
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-wider"
                  style={{ background:"var(--primary)", color:"#fff" }}>Most Popular</span>
              )}
              <p className="font-display text-lg font-bold mb-1" style={{ color:"var(--text)" }}>{plan.name}</p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-display text-2xl font-bold" style={{ color:"var(--text)" }}>{plan.price}</span>
                <span className="text-xs" style={{ color:"var(--muted)" }}>/ {plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-5 flex-1">
                {plan.features.map(f=>(
                  <li key={f} className="flex gap-2.5 text-sm" style={{ color:"var(--muted)" }}>
                    <span style={{ color:"var(--primary)" }} className="flex-shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <button onClick={()=>upgrade(plan.id)} disabled={plan.id==="free"||loading===plan.id}
                className={plan.highlight?"btn btn-primary w-full":"btn btn-secondary w-full"}
                style={plan.id==="free"?{opacity:.5,cursor:"default"}:{}}>
                {loading===plan.id?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:plan.cta}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      <p className="text-center label mt-6" style={{ fontSize:"9px" }}>Secure payments via Razorpay · Cancel anytime</p>
    </div>
  );
}
