"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";

export type CardVariant = "slay" | "healing" | "mid" | "cooked";

export function scoreToVariant(score: number): CardVariant {
  if (score >= 75) return "slay";
  if (score >= 60) return "healing";
  if (score >= 35) return "mid";
  return "cooked";
}

export function scoreToSlang(score: number, ghosting = "low", toxicity = "low"): string {
  if (score >= 90) return "slay coded, main character era fr. understood the assignment no cap";
  if (score >= 75) return "ate and left no crumbs bestie. W rizz confirmed, slay cosmic era";
  if (score >= 60) return "healing arc unlocked. the effort is there, just gotta communicate bestie";
  if (score >= 45) return "it's giving situationship energy. potential is there but we need to talk";
  if (score >= 30) return "bestie the ick has entered the chat. this might be your villain origin story";
  return "run. block. heal. that's the entire action plan bestie, we're cooked fr";
}

const CFG = {
  slay:    { bg:"#f8f7ff", score:"#6c55e0", text:"#3b3060", border:"rgba(108,85,224,.2)" },
  healing: { bg:"#f0fdf4", score:"#047857", text:"#064e3b", border:"rgba(4,120,87,.2)" },
  mid:     { bg:"#fff8ee", score:"#b45309", text:"#5a3f00", border:"rgba(180,83,9,.2)" },
  cooked:  { bg:"#fff5f5", score:"#cc0000", text:"#5a0000", border:"rgba(204,0,0,.18)" },
};

function metricText(type: string, value: string | number): string {
  const v = String(value).toLowerCase();
  if (type === "compat") {
    const n = parseInt(String(value));
    if (n >= 75) return "compatibility: we're literally soulmates";
    if (n >= 55) return "compatibility: mid but fixable ngl";
    return "compatibility: the ick said no";
  }
  if (type === "ghost") {
    if (v === "low") return "ghosting risk: they're not going anywhere";
    if (v === "medium") return "ghosting risk: lowkey hot and cold";
    return "ghosting risk: left on read incoming";
  }
  if (v === "low") return "toxicity: zero ick detected";
  if (v === "medium") return "toxicity: some icks detected bestie";
  return "toxicity: we're cooked fr";
}

interface Props {
  score: number; verdict: string; compatibility: number;
  ghostingRisk: string; toxicity: string;
  speakerA?: string; speakerB?: string;
  variant: CardVariant; showDownload?: boolean;
}

export function GenZCardDisplay({ score, verdict, compatibility, ghostingRisk, toxicity, speakerA="You", speakerB="Them", variant }: Props) {
  const c = CFG[variant];
  return (
    <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:"8px", padding:"26px", width:"100%", maxWidth:"320px", fontFamily:"'Inter',system-ui,sans-serif", position:"relative" }}>
      <div style={{ fontFamily:"'Montserrat',sans-serif", fontSize:"9px", fontWeight:800, letterSpacing:"0.2em", color:"rgba(0,0,0,.2)", textTransform:"uppercase", marginBottom:"10px" }}>AURAXA</div>
      <div style={{ fontSize:"11px", color:"rgba(0,0,0,.3)", marginBottom:"14px", fontFamily:"'Montserrat',sans-serif", fontWeight:600, letterSpacing:"0.06em" }}>{speakerA.toUpperCase()} × {speakerB.toUpperCase()}</div>
      <div style={{ fontFamily:"'Montserrat',sans-serif", fontSize:"68px", fontWeight:800, lineHeight:1, letterSpacing:"-0.03em", color:c.score, marginBottom:"8px" }}>{score}</div>
      <div style={{ fontSize:"14px", lineHeight:1.45, color:c.text, marginBottom:"18px" }}>{verdict}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:"7px", marginBottom:"18px" }}>
        {[
          { t:"compat", v:String(compatibility), icon:"♥" },
          { t:"ghost",  v:ghostingRisk, icon:"◌" },
          { t:"tox",    v:toxicity,     icon:"◈" },
        ].map(m => (
          <div key={m.t} style={{ fontSize:"12px", display:"flex", alignItems:"center", gap:"7px", color:c.text, opacity:.8 }}>
            <span style={{ color:c.score }}>{m.icon}</span>
            {metricText(m.t, m.v)}
          </div>
        ))}
      </div>
      <div style={{ fontFamily:"'Montserrat',sans-serif", fontSize:"9px", fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", paddingTop:"12px", borderTop:"1px solid rgba(0,0,0,.09)", color:"rgba(0,0,0,.25)" }}>analyzed by auraxa.app · no cap, all data</div>
    </div>
  );
}

export default function GenZCard(props: Props & { showDownload?: boolean }) {
  const { showDownload = true, ...cardProps } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      const h2c = (await import("html2canvas")).default;
      const canvas = await h2c(ref.current!, { scale:3, backgroundColor:CFG[cardProps.variant].bg, useCORS:true, logging:false });
      const a = document.createElement("a");
      a.download = `auraxa-${cardProps.variant}-${cardProps.score}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } catch(e) { console.error(e); }
    finally { setDownloading(false); }
  };

  const share = async () => {
    const text = `My Auraxa score: ${cardProps.score}/100 — "${cardProps.verdict.slice(0,80)}" 🔮 auraxa.app`;
    try {
      if (navigator.share) await navigator.share({ text, url: window.location.href });
      else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch {}
  };

  return (
    <motion.div initial={{ opacity:0, y:20, scale:.96 }} animate={{ opacity:1, y:0, scale:1 }} transition={{ duration:.4, ease:[.2,.8,.2,1] }}>
      <div ref={ref}><GenZCardDisplay {...cardProps} /></div>
      {showDownload && (
        <div className="flex gap-2 mt-3" style={{ maxWidth:"320px" }}>
          <button onClick={download} disabled={downloading} className="btn btn-primary flex-1" style={{ fontSize:"11px", padding:"9px 14px" }}>
            {downloading ? "Generating..." : "↓ Save Card"}
          </button>
          <button onClick={share} className="btn btn-secondary" style={{ fontSize:"11px", padding:"9px 14px" }}>
            {copied ? "Copied!" : "Share ↗"}
          </button>
        </div>
      )}
    </motion.div>
  );
}