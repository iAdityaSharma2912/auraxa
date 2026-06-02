import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of Auraxa.",
};

const SECTIONS = [
  { title: "1. Acceptance of Terms", body: [
    "By using Auraxa, you agree to these Terms and our Privacy Policy.",
    "If you do not agree, do not use Auraxa.",
    "We may update these terms; continued use constitutes acceptance.",
  ]},
  { title: "2. Description of Service", body: [
    "Auraxa is an AI-powered emotional intelligence platform with astrology and palm reading features.",
    "Provided for personal, informational, and entertainment purposes only.",
    "Not a substitute for professional therapy, medical, or psychological advice.",
    "AI insights are probabilistic and may not be accurate.",
  ]},
  { title: "3. Account Registration", body: [
    "Provide accurate information when creating an account.",
    "You are responsible for your credentials and all activity under your account.",
    "You must be at least 13 years old.",
  ]},
  { title: "4. Acceptable Use", body: [
    "Use Auraxa only for lawful purposes.",
    "Do not upload content you don't have the right to share.",
    "Do not use Auraxa to harass, stalk, or harm others.",
    "Do not reverse engineer or scrape the platform.",
  ]},
  { title: "5. Privacy of Third Parties", body: [
    "When uploading conversations involving others, ensure you have appropriate consent.",
    "You are responsible for compliance with laws applicable to you.",
  ]},
  { title: "6. Subscription and Payments", body: [
    "Free tier with limited analyses; paid plans with more features.",
    "Subscriptions billed in advance, cancel anytime.",
    "Prices may change with 30 days notice.",
  ]},
  { title: "7. Intellectual Property", body: [
    "Auraxa's content and features are owned by us.",
    "You retain ownership of content you submit.",
    "You grant us a limited licence to process it for the service.",
  ]},
  { title: "8. Disclaimers", body: [
    "Provided 'as is' without warranties.",
    "AI analysis is probabilistic and may reflect biases.",
    "Astrology and palmistry are for entertainment only.",
  ]},
  { title: "9. Limitation of Liability", body: [
    "We are not liable for indirect or consequential damages.",
    "Total liability limited to amounts paid in the prior 12 months.",
  ]},
  { title: "10. Termination", body: [
    "We may suspend accounts for violations. You may delete yours anytime.",
  ]},
  { title: "11. Governing Law", body: [
    "Governed by the laws of India.",
  ]},
  { title: "12. Contact", body: [
    "Questions: legal@auraxa.app",
  ]},
];

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <header className="px-6 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="label hover:text-text transition-colors">← Back to Auraxa</Link>
          <Link href="/privacy" className="label hover:text-text transition-colors">Privacy →</Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="label mb-3" style={{ color: "#3457d5" }}>Legal</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4" style={{ color: "#171a20" }}>Terms of Service</h1>
          <p style={{ color: "#5c5e62" }}>Last updated: 31 May 2026</p>
          <p className="mt-4 leading-relaxed" style={{ color: "#5c5e62" }}>
            Please read these Terms carefully before using Auraxa.
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
            <Link href="/privacy" className="label hover:text-text transition-colors">Privacy</Link>
            <Link href="/" className="label hover:text-text transition-colors">Home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
