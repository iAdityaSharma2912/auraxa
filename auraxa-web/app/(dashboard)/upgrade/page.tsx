"use client";

import { motion } from "framer-motion";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    analyses: "3 / month",
    features: [
      "3 analyses per month",
      "Basic emotional scores",
      "Gen Z score cards",
      "Hard truths section",
    ],
    current: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 299,
    analyses: "20 / month",
    highlight: true,
    features: [
      "20 analyses per month",
      "Full deep report (all sections)",
      "Scoring breakdown + sub-metrics",
      "Conversation phases & peak moments",
      "Roast + Astrology reading",
      "AI Advisor (50 msgs/month)",
      "PDF download",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 599,
    analyses: "Unlimited",
    features: [
      "Unlimited analyses",
      "Everything in Premium",
      "Unlimited AI Advisor",
      "Priority processing",
      "Early access to new features",
    ],
  },
];

export default function UpgradePage() {
  const copyEmail = () => {
    navigator.clipboard.writeText("imaddy2912@gmail.com");
  };

  return (
    <div className="px-3 sm:px-5 md:px-8 py-4 md:py-8 max-w-3xl">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <p className="label mb-2" style={{ fontSize: "10px", color: "var(--primary)" }}>
          PLANS & PRICING
        </p>
        <h1
          className="font-display font-bold mb-2"
          style={{ fontSize: "clamp(1.5rem,5vw,2rem)", color: "var(--text)" }}
        >
          Upgrade Auraxa
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Online payments coming soon. Reach out for early access.
        </p>
      </motion.div>

      {/* Coming Soon Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl p-5 mb-8 text-center"
        style={{
          background: "linear-gradient(135deg, #1e1a2e, #2d1b69)",
          border: "1px solid #6c55e0",
        }}
      >
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
          style={{ background: "rgba(108,85,224,.25)", border: "1px solid #6c55e0" }}
        >
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#9b8cf0" }} />
          <span className="font-mono text-xs font-bold" style={{ color: "#9b8cf0" }}>
            PAYMENT GATEWAY — COMING SOON
          </span>
        </div>

        <p className="text-sm mb-4 leading-relaxed" style={{ color: "rgba(255,255,255,.75)" }}>
          Online payments are being set up. Until then, reach out directly to
          get premium access with a promo code.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Email */}
          <button
            onClick={copyEmail}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all"
            style={{
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.15)",
              color: "#fff",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            imaddy2912@gmail.com
          </button>

          {/* Instagram */}
          <a
            href="https://instagram.com/iaddy29"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all"
            style={{
              background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
            @iaddy29
          </a>
        </div>

        <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,.4)" }}>
          Click email to copy · DM on Instagram for promo code
        </p>
      </motion.div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 + 0.2 }}
            className="relative"
          >
            {plan.highlight && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded font-display font-bold whitespace-nowrap"
                style={{ background: "var(--primary)", color: "#fff", fontSize: "9px", letterSpacing: "0.1em" }}
              >
                MOST POPULAR
              </div>
            )}

            <div
              className="card p-5 h-full flex flex-col"
              style={plan.highlight ? { border: "2px solid var(--primary)", boxShadow: "0 4px 24px rgba(108,85,224,.12)" } : {}}
            >
              {/* Plan name */}
              <div className="mb-3">
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded font-display font-bold text-xs"
                  style={{
                    background: plan.highlight ? "var(--pri-soft)" : "var(--surface-alt)",
                    color: plan.highlight ? "var(--primary)" : "var(--muted)",
                    border: `1px solid ${plan.highlight ? "var(--pri-border)" : "var(--line)"}`,
                  }}
                >
                  {plan.name}
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-1">
                <span
                  className="font-display font-bold"
                  style={{ fontSize: "1.8rem", color: "var(--text)" }}
                >
                  {plan.price === 0 ? "Free" : `₹${plan.price}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-xs" style={{ color: "var(--muted)" }}>/ month</span>
                )}
              </div>
              <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
                {plan.analyses} analyses
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke={plan.highlight ? "var(--primary)" : "var(--green)"}
                      strokeWidth="2.5" strokeLinecap="round"
                      className="flex-shrink-0 mt-0.5"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.current ? (
                <div
                  className="w-full py-3 rounded text-center font-display font-bold text-xs"
                  style={{ background: "var(--surface-alt)", color: "var(--muted)" }}
                >
                  Current Plan
                </div>
              ) : (
                <a
                  href="https://instagram.com/iaddy29"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded text-center font-display font-bold text-xs block"
                  style={{
                    background: plan.highlight ? "var(--primary)" : "var(--surface-alt)",
                    color: plan.highlight ? "#fff" : "var(--text)",
                    textDecoration: "none",
                    letterSpacing: "0.04em",
                  }}
                >
                  Get Promo Code →
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* How to get access */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="card p-5"
      >
        <p className="label mb-4" style={{ fontSize: "9px" }}>HOW TO GET PREMIUM ACCESS</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: "1",
              title: "DM on Instagram",
              desc: "Message @iaddy29 on Instagram or email imaddy2912@gmail.com",
            },
            {
              step: "2",
              title: "Get Promo Code",
              desc: "You'll receive a promo code for the plan you want.",
            },
            {
              step: "3",
              title: "Instant Access",
              desc: "Your account gets upgraded immediately. Full access, all sections.",
            },
          ].map((s) => (
            <div key={s.step} className="flex gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-xs"
                style={{
                  background: "var(--pri-soft)",
                  border: "1px solid var(--pri-border)",
                  color: "var(--primary)",
                }}
              >
                {s.step}
              </div>
              <div>
                <p className="font-display font-bold text-sm mb-0.5" style={{ color: "var(--text)" }}>
                  {s.title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}

