import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Auraxa Score Card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Variant colors
const VARIANT_COLORS: Record<string, { bg: string; score: string; border: string; text: string }> = {
  slay:    { bg: "#f8f7ff", score: "#6c55e0", border: "#d4cfff", text: "#3b3060" },
  healing: { bg: "#f0fdf4", score: "#047857", border: "#bbf7d0", text: "#064e3b" },
  mid:     { bg: "#fff8ee", score: "#b45309", border: "#fed7aa", text: "#5a3f00" },
  cooked:  { bg: "#fff5f5", score: "#cc0000", border: "#fecaca", text: "#5a0000" },
};

const VARIANT_LABELS: Record<string, string> = {
  slay: "Slay Era", healing: "Healing Arc", mid: "Mid Energy", cooked: "Cooked",
};

function scoreToVariant(score: number): string {
  if (score >= 75) return "slay";
  if (score >= 60) return "healing";
  if (score >= 35) return "mid";
  return "cooked";
}

export default async function ResultOGImage({
  params,
}: {
  params: { id: string };
}) {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://auraxa.app";

  // Fetch analysis data from backend
  let score = 72;
  let speakerA = "You";
  let speakerB = "Them";
  let compatibility = 68;
  let toxicity = "low";
  let ghosting = "low";
  let verdict = "healing arc unlocked. the effort is there, just gotta communicate bestie";

  try {
    const res = await fetch(
      `${process.env.INTERNAL_API_URL || "http://localhost:8000"}/api/analyze/${params.id}/results`,
      {
        headers: { "X-Internal-Request": "og-image" },
        next: { revalidate: 3600 },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const s = data.scores;
      if (s) {
        score       = s.overall_score ?? score;
        compatibility = s.compatibility_score ?? compatibility;
        toxicity    = s.toxicity_level ?? toxicity;
        ghosting    = s.ghosting_risk ?? ghosting;
      }
      speakerA = data.speakers?.a ?? speakerA;
      speakerB = data.speakers?.b ?? speakerB;
      verdict  = data.genz_verdict ?? verdict;
    }
  } catch {
    // Use fallback values
  }

  const variant = scoreToVariant(score);
  const c = VARIANT_COLORS[variant];
  const label = VARIANT_LABELS[variant];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          background: "#ffffff",
          display: "flex",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left panel — branding */}
        <div style={{
          width: "380px", height: "100%",
          background: "#1e1a2e",
          display: "flex", flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 48px",
        }}>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "0.12em", color: "#fff", marginBottom: "8px" }}>
              AURA<span style={{ color: "#6c55e0" }}>XA</span>
            </div>
            <div style={{ fontSize: "13px", letterSpacing: "0.3em", color: "rgba(255,255,255,.35)", textTransform: "uppercase" }}>
              Feel The Unsaid
            </div>
          </div>
          <div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,.4)", marginBottom: "16px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {speakerA.toUpperCase()} × {speakerB.toUpperCase()}
            </div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,.3)", lineHeight: 1.5 }}>
              AI relationship analysis<br />
              auraxa.app
            </div>
          </div>
        </div>

        {/* Right panel — score card */}
        <div style={{
          flex: 1, height: "100%",
          background: c.bg,
          display: "flex", flexDirection: "column",
          justifyContent: "center",
          padding: "60px 64px",
        }}>
          {/* Variant badge */}
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: `rgba(0,0,0,.06)`,
            borderRadius: "4px",
            padding: "6px 14px",
            marginBottom: "24px",
            width: "fit-content",
          }}>
            <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", color: c.score, textTransform: "uppercase" }}>
              {label}
            </span>
          </div>

          {/* Score */}
          <div style={{
            fontSize: "140px", fontWeight: 800, lineHeight: 1,
            letterSpacing: "-0.04em", color: c.score,
            marginBottom: "16px",
          }}>
            {score}
          </div>

          {/* Verdict */}
          <div style={{
            fontSize: "20px", lineHeight: 1.4, color: c.text,
            marginBottom: "40px", maxWidth: "480px",
            opacity: 0.85,
          }}>
            {verdict.length > 80 ? verdict.slice(0, 80) + "..." : verdict}
          </div>

          {/* Metrics row */}
          <div style={{ display: "flex", gap: "16px" }}>
            {[
              { l: "Compatibility", v: `${compatibility}%` },
              { l: "Toxicity",      v: toxicity },
              { l: "Ghost Risk",    v: ghosting },
            ].map(m => (
              <div key={m.l} style={{
                background: "rgba(0,0,0,.05)", borderRadius: "6px",
                padding: "12px 18px", minWidth: "110px",
              }}>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(0,0,0,.35)", marginBottom: "4px" }}>
                  {m.l}
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: c.score, textTransform: "capitalize" }}>
                  {m.v}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: "40px", fontSize: "12px", fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: "rgba(0,0,0,.2)",
          }}>
            analyzed by auraxa.app · no cap, all data
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
