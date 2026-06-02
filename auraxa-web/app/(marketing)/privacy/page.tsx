import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Auraxa collects, uses, and protects your data.",
};

const SECTIONS = [
  { title: "1. Information We Collect", body: [
    "Account information: your name, email, and Google profile info if using OAuth.",
    "Conversation data: processed by our AI and deleted immediately after analysis. We do not store raw conversation content.",
    "Analysis results: stored so you can revisit them.",
    "Usage data: pages visited, features used, analysis count.",
    "Palm images: processed and deleted immediately. We never store palm images.",
  ]},
  { title: "2. How We Use Your Information", body: [
    "To provide and improve our AI emotional intelligence service.",
    "To personalise your experience and remember past analyses.",
    "To send transactional emails. No marketing unless you opt in.",
    "To enforce our Terms and prevent abuse.",
  ]},
  { title: "3. AI Processing", body: [
    "Conversation text is sent to third-party AI providers (OpenRouter, Gemini, NVIDIA) for processing.",
    "We use multiple providers in a fallback chain.",
    "We do not use your conversations to train AI models.",
  ]},
  { title: "4. Data Sharing", body: [
    "We do not sell your personal data.",
    "We share data only with service providers necessary to operate Auraxa.",
    "We may disclose data if required by law.",
  ]},
  { title: "5. Data Retention", body: [
    "Analysis results retained until you delete them or close your account.",
    "Raw conversation text and palm images deleted immediately after processing.",
    "You may request deletion of all data at any time.",
  ]},
  { title: "6. Security", body: [
    "Industry-standard encryption (TLS) for data in transit and at rest.",
    "Passwords hashed with bcrypt, never stored in plain text.",
    "Access to production systems restricted to authorised personnel.",
  ]},
  { title: "7. Your Rights", body: [
    "Access, correct, delete, or export your data anytime from your profile.",
    "EU/UK users have additional GDPR rights.",
  ]},
  { title: "8. Cookies", body: [
    "Session cookies keep you logged in. No tracking or advertising cookies.",
  ]},
  { title: "9. Children", body: [
    "Auraxa is not intended for users under 13. We do not knowingly collect data from children.",
  ]},
  { title: "10. Changes", body: [
    "We may update this policy. Significant changes will be notified by email or in-app.",
  ]},
  { title: "11. Contact", body: [
    "Privacy questions or deletion requests: privacy@auraxa.app",
  ]},
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <header className="px-6 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="label hover:text-text transition-colors">← Back to Auraxa</Link>
          <Link href="/terms" className="label hover:text-text transition-colors">Terms →</Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="label mb-3" style={{ color: "#3457d5" }}>Legal</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4" style={{ color: "#171a20" }}>Privacy Policy</h1>
          <p style={{ color: "#5c5e62" }}>Last updated: 31 May 2026</p>
          <p className="mt-4 leading-relaxed" style={{ color: "#5c5e62" }}>
            Auraxa is committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights.
          </p>
        </div>
        <div className="space-y-6">
          {SECTIONS.map(s => (
            <div key={s.title} className="card p-6">
              <h2 className="font-display text-base font-semibold mb-4" style={{ color: "#171a20" }}>{s.title}</h2>
              <ul className="space-y-3">
                {s.body.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "#5c5e62" }}>
                    <span style={{ color: "#3457d5" }} className="flex-shrink-0 mt-0.5">—</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 flex items-center justify-between flex-wrap gap-4" style={{ borderTop: "1px solid var(--line)" }}>
          <p className="label">© 2026 AURAXA</p>
          <div className="flex gap-6">
            <Link href="/terms" className="label hover:text-text transition-colors">Terms</Link>
            <Link href="/" className="label hover:text-text transition-colors">Home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
