import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Auraxa — Feel The Unsaid";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function DefaultOGImage() {
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
        {/* Left — dark brand panel */}
        <div style={{
          width: "420px", height: "100%",
          background: "#1e1a2e",
          display: "flex", flexDirection: "column",
          justifyContent: "center",
          padding: "60px 52px",
        }}>
          <div style={{ fontSize: "52px", fontWeight: 800, letterSpacing: "0.05em", color: "#fff", lineHeight: 1, marginBottom: "16px" }}>
            AURA<span style={{ color: "#6c55e0" }}>XA</span>
          </div>
          <div style={{ fontSize: "14px", letterSpacing: "0.35em", color: "rgba(255,255,255,.35)", textTransform: "uppercase", marginBottom: "40px" }}>
            Feel The Unsaid
          </div>
          <div style={{ width: "40px", height: "2px", background: "#6c55e0", marginBottom: "32px" }} />
          <div style={{ fontSize: "18px", color: "rgba(255,255,255,.6)", lineHeight: 1.6 }}>
            AI-powered relationship analysis
          </div>
        </div>

        {/* Right — value prop */}
        <div style={{
          flex: 1, height: "100%",
          background: "#f8f7ff",
          display: "flex", flexDirection: "column",
          justifyContent: "center",
          padding: "60px 64px",
        }}>
          <div style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6c55e0", marginBottom: "24px" }}>
            Upload any chat
          </div>
          <div style={{ fontSize: "44px", fontWeight: 800, color: "#1e1a2e", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "32px" }}>
            Get your relationship score in 60 seconds
          </div>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              "Compatibility + toxicity score",
              "Ghosting risk analysis",
              "Gen Z shareable score cards",
              "AI advisor chat",
            ].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6c55e0", flexShrink: 0 }} />
                <span style={{ fontSize: "18px", color: "#5c5e62" }}>{f}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "40px", fontSize: "14px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(0,0,0,.25)" }}>
            auraxa.app · no cap, all data
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
