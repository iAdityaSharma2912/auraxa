"use client";

import Link from "next/link";

// ─────────────────────────────────────────────────────────
//  AURAXA LOGO — Tesla Theme
//  Montserrat wordmark · minimal geometric mark
//  AURA (near-black) + XA (Tesla blue)
// ─────────────────────────────────────────────────────────

function Mark({ s = 32 }: { s?: number }) {
  const cx = s * 0.42, cy = s * 0.5, r = s * 0.4;
  const dLeft = s * 0.46, dTop = s * 0.12, dBot = s * 0.88;
  const dR = (dBot - dTop) / 2;
  const id = Math.round(s);

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <clipPath id={`d-${id}`}>
          <path d={`M ${dLeft} ${dTop} L ${dLeft} ${dBot} L ${s*0.5} ${dBot} A ${dR} ${dR} 0 0 0 ${s*0.5} ${dTop} Z`} />
        </clipPath>
      </defs>
      {/* Circle — Tesla blue */}
      <circle cx={cx} cy={cy} r={r} fill="#3457d5" />
      {/* D-shape — near black, overlapping */}
      <path
        d={`M ${dLeft} ${dTop} L ${dLeft} ${dBot} L ${s*0.5} ${dBot} A ${dR} ${dR} 0 0 0 ${s*0.5} ${dTop} Z`}
        fill="#171a20"
      />
      {/* Seam */}
      <line x1={dLeft} y1={dTop} x2={dLeft} y2={dBot} stroke="#ffffff" strokeWidth={s*0.03} />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={s*0.04} fill="#ffffff" />
    </svg>
  );
}

const MARK_PX = { xs: 18, sm: 24, md: 30, lg: 40, xl: 56 };
const AURA_PX = { xs: 15, sm: 19, md: 24, lg: 32, xl: 46 };
const TAG_PX  = { xs: 0,  sm: 8,  md: 9,  lg: 10, xl: 12 };
const GAP_PX  = { xs: 7,  sm: 9,  md: 11, lg: 14, xl: 18 };

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "compact";
  href?: string | null;
  className?: string;
  glow?: boolean;
  showTagline?: boolean;
}

export default function Logo({
  size = "md", variant = "full", href = "/",
  className = "", showTagline = true,
}: LogoProps) {
  const markPx = MARK_PX[size];
  const auraPx = AURA_PX[size];
  const tagPx  = TAG_PX[size];
  const gapPx  = GAP_PX[size];

  const content = (
    <div className={className} style={{ display: "inline-flex", alignItems: "center", gap: gapPx, userSelect: "none" }}>
      {variant !== "compact" && <Mark s={markPx} />}
      {variant !== "icon" && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline", lineHeight: 1 }}>
            <span style={{
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: auraPx, fontWeight: 700, letterSpacing: "-0.01em", color: "#171a20",
            }}>AURA</span>
            <span style={{
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: auraPx, fontWeight: 700, letterSpacing: "-0.01em", color: "#3457d5",
            }}>XA</span>
          </div>
          {showTagline && tagPx >= 7 && (
            <span style={{
              fontFamily: "var(--font-mono-var), monospace",
              fontSize: tagPx, fontWeight: 500, letterSpacing: "0.3em",
              color: "#5c5e62", textTransform: "uppercase", marginTop: 3,
            }}>Feel The Unsaid</span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} style={{ display: "inline-flex" }} className="hover:opacity-80 transition-opacity">{content}</Link>;
  }
  return content;
}

export function LogoIcon({ size = 32 }: { size?: number }) {
  return <Mark s={size} />;
}
