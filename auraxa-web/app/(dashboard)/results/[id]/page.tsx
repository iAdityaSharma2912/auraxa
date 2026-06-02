"use client";

import { useEffect, useState, useCallback, use, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import GenZCard, { scoreToVariant, scoreToSlang } from "@/components/cards/GenZCard";

// ─────────────────────────────────────────────────────────
//  SVG ICON LIBRARY
// ─────────────────────────────────────────────────────────
function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.75 }: {
  name: string; size?: number; color?: string; strokeWidth?: number;
}) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icons: Record<string, React.ReactNode> = {
    // Status dots
    check:   <svg {...p}><path d="M20 6L9 17l-5-5"/></svg>,
    warn:    <svg {...p}><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>,
    alert:   <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    danger:  <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    // Relationships
    heart:   <svg {...p} fill={color} stroke="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    ghost:   <svg {...p}><path d="M9 10h.01M15 10h.01M12 2a8 8 0 018 8v10l-3-2-2 2-2-2-2 2-2-2-3 2V10a8 8 0 018-8z"/></svg>,
    users:   <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg>,
    // Scores / data
    star:    <svg {...p} fill={color} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    zap:     <svg {...p} fill={color} stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    minus:   <svg {...p}><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    skull:   <svg {...p}><circle cx="12" cy="11" r="8"/><path d="M9 21h6m-3-4v4m-2-8h.01M15 13h.01M9 17H8a5 5 0 01-1-9.9"/></svg>,
    // Sections
    book:    <svg {...p}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
    card:    <svg {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    barChart:<svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    trend:   <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    search:  <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    tool:    <svg {...p}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
    brain:   <svg {...p}><path d="M9.5 2A2.5 2.5 0 017 4.5v0A2.5 2.5 0 014.5 7v0A2.5 2.5 0 012 9.5v0A2.5 2.5 0 004.5 12v0A2.5 2.5 0 007 14.5v0A2.5 2.5 0 009.5 17H12m2.5-15A2.5 2.5 0 0117 4.5v0A2.5 2.5 0 0119.5 7v0A2.5 2.5 0 0122 9.5v0a2.5 2.5 0 01-2.5 2.5v0A2.5 2.5 0 0117 14.5v0A2.5 2.5 0 0114.5 17H12m0 0v5"/></svg>,
    message: <svg {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    download:<svg {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    share:   <svg {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    instagram:<svg {...p} fill={color} stroke="none"><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke={color} strokeWidth={strokeWidth}/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke={color} strokeWidth={strokeWidth+1}/></svg>,
    back:    <svg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    info:    <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    // Attachment
    shield:  <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    lock:    <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    unlock:  <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>,
    refresh: <svg {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
    balance: <svg {...p}><line x1="12" y1="3" x2="12" y2="21"/><path d="M3 7l9-4 9 4"/><path d="M4 10a4 4 0 008 0"/><path d="M12 10a4 4 0 008 0"/></svg>,
    clock:   <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  };
  return <>{icons[name] ?? icons.info}</>;
}

// Status dot component (replaces colored circle emojis)
function StatusDot({ level }: { level: string }) {
  const colors: Record<string,string> = { low:"var(--green)", medium:"var(--amber)", high:"var(--red)", critical:"var(--red)" };
  const c = colors[level] ?? "var(--muted)";
  return <span className="inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0" style={{ background: `${c}18`, border: `1.5px solid ${c}` }}><span className="w-2 h-2 rounded-full" style={{ background: c }} /></span>;
}

// ─────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────
interface Scores {
  overall_score: number; compatibility_score: number;
  communication_balance: number; speaker_a_percentage: number;
  speaker_b_percentage: number; toxicity_level: string;
  ghosting_risk: string; attachment_style?: string;
  patterns_detected: string[]; ai_narrative?: string;
}
interface TimelinePoint { timestamp: string; emotional_intensity: number; sentiment: string; speaker: string; }
interface Result {
  id: string; status: string; speakers?: { a?: string; b?: string };
  scores?: Scores; ai_narrative?: string; message_count?: number;
  date_range?: string | { start?: string; end?: string };
  genz_verdict?: string; timeline?: TimelinePoint[];
}

// ─────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────
const SC: Record<string,string> = { low:"var(--green)", medium:"var(--amber)", high:"var(--red)", critical:"var(--red)" };

function scoreLabel(n: number) {
  if (n >= 80) return { t:"Excellent", c:"var(--green)" };
  if (n >= 65) return { t:"Good",      c:"var(--green)" };
  if (n >= 50) return { t:"Moderate",  c:"var(--amber)" };
  if (n >= 35) return { t:"Low",       c:"var(--amber)" };
  return               { t:"Critical", c:"var(--red)" };
}

function toxicityVerdict(level: string) {
  const map: Record<string,{icon:string;iconColor:string;label:string;genZ:string;explain:string}> = {
    low:      { icon:"check",  iconColor:"var(--green)", label:"Low Toxicity",      genZ:"bestie you're safe here fr",         explain:"The conversation shows healthy communication patterns. No major red flags. Both parties engage respectfully." },
    medium:   { icon:"warn",   iconColor:"var(--amber)", label:"Some Toxicity",     genZ:"a few icks are showing ngl",         explain:"Some concerning patterns — passive-aggression, dismissiveness, or inconsistent emotional engagement. Worth being aware of." },
    high:     { icon:"alert",  iconColor:"var(--red)",   label:"High Toxicity",     genZ:"bestie the ick is LOUD in this one", explain:"Significant toxic patterns detected — blame-shifting, contempt, emotional manipulation, or persistent disrespect. This needs addressing." },
    critical: { icon:"danger", iconColor:"var(--red)",   label:"Critical Toxicity", genZ:"run bestie this is your sign fr fr", explain:"Severe toxic dynamics detected. Multiple patterns of emotional harm, manipulation, or abuse indicators present. Please consider distancing yourself." },
  };
  return map[level] ?? map.low;
}

function ghostingVerdict(risk: string) {
  const map: Record<string,{icon:string;iconColor:string;label:string;genZ:string;explain:string}> = {
    low:    { icon:"heart", iconColor:"var(--green)", label:"Staying Power",    genZ:"they're not going anywhere bestie",   explain:"Communication patterns suggest consistent engagement, reciprocal interest, and no major withdrawal signals." },
    medium: { icon:"clock", iconColor:"var(--amber)", label:"Watch Closely",    genZ:"lowkey hot and cold energy detected", explain:"Inconsistent response patterns detected. There may be periods of withdrawal or reduced engagement. Monitor communication frequency." },
    high:   { icon:"ghost", iconColor:"var(--red)",   label:"Ghost Risk Alert", genZ:"left on read incoming bestie",        explain:"Strong ghosting indicators — decreasing response frequency, shorter replies, emotional withdrawal. The connection may be fading." },
  };
  return map[risk] ?? map.low;
}

function attachmentVerdict(style?: string) {
  const map: Record<string,{icon:string;iconColor:string;explain:string;suggestion:string}> = {
    secure:       { icon:"shield",  iconColor:"var(--green)", explain:"Secure attachment is the gold standard. Both parties feel safe expressing needs and responding to each other's emotions.", suggestion:"Maintain this pattern — it's the foundation for genuine intimacy." },
    anxious:      { icon:"alert",   iconColor:"var(--amber)", explain:"Anxious attachment shows up as over-texting, reassurance-seeking, fear of abandonment. One person may be carrying more emotional weight.", suggestion:"Work on self-soothing. Your needs are valid — but express them calmly." },
    avoidant:     { icon:"unlock",  iconColor:"var(--primary)", explain:"Avoidant patterns appear as emotional distance, deflection, or discomfort with vulnerability. Intimacy feels threatening.", suggestion:"Small steps toward vulnerability. Opening slightly builds the trust needed over time." },
    disorganized: { icon:"refresh", iconColor:"var(--red)",   explain:"Disorganized attachment is the most complex — a push-pull dynamic where intimacy feels both desired and threatening.", suggestion:"This pattern often traces to early experiences. A therapist can genuinely help here." },
  };
  return map[style ?? "secure"] ?? map.secure;
}

const VARIANT_CONFIG: Record<string,{icon:string;iconColor:string;label:string}> = {
  slay:    { icon:"star",  iconColor:"#6c55e0", label:"Slay Era" },
  healing: { icon:"heart", iconColor:"#047857", label:"Healing Arc" },
  mid:     { icon:"minus", iconColor:"#b45309", label:"Mid Energy" },
  cooked:  { icon:"skull", iconColor:"#cc0000", label:"Cooked" },
};

// ─────────────────────────────────────────────────────────
//  SCORE RING
// ─────────────────────────────────────────────────────────
function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const r = size * 0.41, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-alt)" strokeWidth="10"/>
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.6, ease: [0.16,1,0.3,1], delay: 0.4 }}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold" style={{ fontSize: size * 0.225, color: "var(--text)", lineHeight: 1 }}>{score}</span>
        <span className="label" style={{ fontSize: size * 0.07 }}>/ 100</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  METRIC BAR
// ─────────────────────────────────────────────────────────
function MetricBar({ label, value, color, delay = 0 }: { label: string; value: number; color: string; delay?: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="label" style={{ fontSize: "9px" }}>{label}</span>
        <span className="font-display font-bold text-xs" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-alt)" }}>
        <motion.div className="h-full rounded-full" style={{ background: color }}
          initial={{ width: 0 }} animate={{ width: `${Math.min(value,100)}%` }}
          transition={{ duration: 1.2, delay, ease: [0.16,1,0.3,1] }}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  TIMELINE CHART
// ─────────────────────────────────────────────────────────
function TimelineChart({ points, speakerA, speakerB }: { points: TimelinePoint[]; speakerA: string; speakerB: string }) {
  if (!points?.length) return null;
  const max = Math.max(...points.map(p => p.emotional_intensity), 1);
  const w = 100 / points.length;
  const sc = (s:string) => s==="positive"?"#047857":s==="negative"?"#cc0000":"#5c5e62";
  return (
    <div>
      <div className="flex items-end gap-0.5 h-24 sm:h-32" style={{ overflowX:"auto" }}>
        {points.map((p,i) => {
          const h = Math.max((p.emotional_intensity/max)*100, 5);
          return (
            <motion.div key={i} className="flex-shrink-0 rounded-t cursor-pointer relative group"
              style={{ width:`${Math.max(w,1.5)}%`, minWidth:"6px", height:`${h}%`, background:sc(p.sentiment), opacity:p.speaker==="a"?1:.55 }}
              initial={{ scaleY:0 }} animate={{ scaleY:1 }} transition={{ delay:i*.02, duration:.3 }}>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-10" style={{ minWidth:"110px" }}>
                <div className="card px-2 py-1.5 text-center" style={{ fontSize:"10px" }}>
                  <p className="font-bold" style={{ color:"var(--text)" }}>{p.speaker==="a"?speakerA:speakerB}</p>
                  <p style={{ color:"var(--muted)" }}>{p.timestamp}</p>
                  <p style={{ color:sc(p.sentiment), textTransform:"capitalize" }}>{p.sentiment}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {[{c:"#047857",l:"Positive"},{c:"#cc0000",l:"Negative"},{c:"#5c5e62",l:"Neutral"}].map(x=>(
          <div key={x.l} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background:x.c }}/><span className="label" style={{ fontSize:"9px" }}>{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  SECTION WRAPPER
// ─────────────────────────────────────────────────────────
function Section({ title, iconName, iconColor = "var(--primary)", accent = false, children }: {
  title: string; iconName: string; iconColor?: string; accent?: boolean; children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-40px" }} transition={{ duration:.5 }}
      className="card overflow-hidden mb-4">
      <div className="px-4 sm:px-6 py-3 flex items-center gap-2.5"
        style={{ borderBottom:"1px solid var(--line)", background:accent?"var(--pri-soft)":"var(--surface)" }}>
        <Icon name={iconName} size={16} color={iconColor}/>
        <h2 className="font-display font-bold text-sm sm:text-base" style={{ color:"var(--text)" }}>{title}</h2>
      </div>
      <div className="px-4 sm:px-6 py-4 sm:py-5">{children}</div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
//  SCORE CARD DOWNLOAD
// ─────────────────────────────────────────────────────────
function DownloadableScoreCard({ result }: { result: Result }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const s = result.scores!;
  const variant = scoreToVariant(s.overall_score);
  const verdict = result.genz_verdict ?? scoreToSlang(s.overall_score, s.ghosting_risk, s.toxicity_level);
  const BG: Record<string,string> = { slay:"#f8f7ff", healing:"#f0fdf4", mid:"#fff8ee", cooked:"#fff5f5" };
  const CLR: Record<string,string> = { slay:"#6c55e0", healing:"#047857", mid:"#b45309", cooked:"#cc0000" };
  const bg = BG[variant]; const clr = CLR[variant];

  const download = async () => {
    setDownloading(true);
    try {
      const h2c = (await import("html2canvas")).default;
      const canvas = await h2c(cardRef.current!, { scale:3, backgroundColor:bg, useCORS:true, logging:false } as any);
      const a = document.createElement("a");
      a.download = `auraxa-${s.overall_score}.png`;
      a.href = canvas.toDataURL("image/png"); a.click();
      toast.success("Score card saved!");
    } catch { toast.error("Download failed."); }
    finally { setDownloading(false); }
  };

  const share = async () => {
    const text = `My Auraxa Score: ${s.overall_score}/100\n"${verdict}"\nauraxa.app`;
    try {
      if (navigator.share) await navigator.share({ text, url:window.location.href });
      else { await navigator.clipboard.writeText(text); toast.success("Copied!"); }
    } catch {}
  };

  return (
    <div>
      <div ref={cardRef} style={{ background:bg, border:`1px solid rgba(0,0,0,.08)`, borderRadius:"10px", padding:"24px", maxWidth:"320px", fontFamily:"'Inter',sans-serif" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"16px" }}>
          <div style={{ fontFamily:"'Montserrat',sans-serif", fontSize:"10px", fontWeight:800, letterSpacing:"0.2em", color:"rgba(0,0,0,.2)", textTransform:"uppercase" }}>AURAXA</div>
          <div style={{ fontSize:"9px", fontFamily:"'Montserrat',sans-serif", fontWeight:600, color:"rgba(0,0,0,.28)", letterSpacing:"0.06em" }}>
            {(result.speakers?.a??"You").toUpperCase()} × {(result.speakers?.b??"Them").toUpperCase()}
          </div>
        </div>
        <div style={{ fontFamily:"'Montserrat',sans-serif", fontSize:"76px", fontWeight:800, lineHeight:1, letterSpacing:"-0.04em", color:clr, marginBottom:"6px" }}>{s.overall_score}</div>
        <div style={{ fontSize:"13px", lineHeight:1.4, color:"rgba(0,0,0,.65)", marginBottom:"18px" }}>{verdict}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px", marginBottom:"16px" }}>
          {[{l:"Compatibility",v:`${s.compatibility_score}%`},{l:"Toxicity",v:s.toxicity_level},{l:"Ghost Risk",v:s.ghosting_risk},{l:"Attachment",v:s.attachment_style??"—"}].map(m=>(
            <div key={m.l} style={{ background:"rgba(0,0,0,.04)", borderRadius:"5px", padding:"7px 9px" }}>
              <div style={{ fontFamily:"'Montserrat',sans-serif", fontSize:"7px", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"rgba(0,0,0,.32)", marginBottom:"2px" }}>{m.l}</div>
              <div style={{ fontFamily:"'Montserrat',sans-serif", fontSize:"12px", fontWeight:700, color:clr, textTransform:"capitalize" }}>{m.v}</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily:"'Montserrat',sans-serif", fontSize:"7px", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", paddingTop:"10px", borderTop:"1px solid rgba(0,0,0,.08)", color:"rgba(0,0,0,.2)", display:"flex", justifyContent:"space-between" }}>
          <span>auraxa.app</span><span>no cap, all data</span>
        </div>
      </div>
      <div className="flex gap-2 mt-3" style={{ maxWidth:"320px" }}>
        <button onClick={download} disabled={downloading} className="btn btn-primary flex-1" style={{ fontSize:"11px", padding:"10px 14px", gap:"6px" }}>
          {downloading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><Icon name="download" size={14} color="#fff"/>Save Card</>}
        </button>
        <button onClick={share} className="btn btn-secondary" style={{ fontSize:"11px", padding:"10px 14px", gap:"6px" }}>
          <Icon name="share" size={14} color="var(--primary)"/>Share
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  SUGGESTIONS
// ─────────────────────────────────────────────────────────
function getSuggestions(s: Scores, a: string, b: string): string[] {
  const r: string[] = [];
  if (s.toxicity_level==="high"||s.toxicity_level==="critical")
    r.push(`The toxicity level is a serious concern. Have a calm conversation with ${b} using "I feel..." instead of "You always..."`);
  if (s.ghosting_risk==="high"||s.ghosting_risk==="medium")
    r.push(`${b}'s response patterns suggest emotional withdrawal. Give space — a brief warm message once works better than multiple texts.`);
  if (s.attachment_style==="anxious")
    r.push("You may be carrying more emotional weight. Before sending that 3am text, journal your feelings first. You deserve reciprocal energy.");
  if (s.attachment_style==="avoidant")
    r.push("The avoidant patterns suggest someone is emotionally guarded. Consistent, low-pressure presence builds the trust needed to open up.");
  if (s.compatibility_score<50)
    r.push("Compatibility is below average. Both of you would need to actively invest in understanding each other's communication styles.");
  if (s.overall_score>=75)
    r.push("The numbers are genuinely positive. Maintain this energy — check in regularly, express appreciation, keep communication honest.");
  if (s.communication_balance<40||s.communication_balance>70)
    r.push("The conversation balance is uneven. One person is carrying more of the dialogue. It's okay to gently name this imbalance.");
  r.push("Take a screen break from analyzing this relationship. The best thing you can bring to any connection is a grounded version of yourself.");
  return r.slice(0, 5);
}

// ─────────────────────────────────────────────────────────
//  FORMAT DATE RANGE
// ─────────────────────────────────────────────────────────
function formatDateRange(dr: string | { start?: string; end?: string } | undefined): string | null {
  if (!dr) return null;
  if (typeof dr === "string") return dr;
  const s = dr.start ?? ""; const e = dr.end ?? "";
  return s && e ? `${s} — ${e}` : s || e || null;
}

// ─────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────
export default function ResultsPage({ params }: { params: Promise<{id:string}> }) {
  const { id } = use(params);
  const [result, setResult] = useState<Result|null>(null);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const sr = await api.get(`/api/analyze/${id}/status`);
      const status = sr.data?.status;
      if (status==="completed") {
        const r = await api.get(`/api/analyze/${id}/results`);
        setResult({ ...r.data, status:"completed" });
      } else if (status==="failed") {
        setResult({ id, status:"failed" } as any);
      } else {
        setResult(prev => prev?{...prev,status}:{id,status} as any);
        setPollCount(c=>c+1); setTimeout(load, 3000);
      }
    } catch { if (pollCount<30) setTimeout(load, 4000); }
    finally { setLoading(false); }
  }, [id, pollCount]);

  useEffect(() => { load(); }, []);

  if (loading && !result) return <div className="flex items-center justify-center min-h-[80vh]"><div className="w-12 h-12 rounded-full border-2 animate-spin" style={{ borderColor:"var(--line-2)", borderTopColor:"var(--primary)" }}/></div>;

  const isProcessing = result && result.status!=="completed" && result.status!=="failed";
  if (isProcessing) {
    const STEPS = ["Extracting text","Structuring messages","Running AI analysis","Scoring patterns","Generating your report"];
    const step = Math.min(pollCount, STEPS.length-1);
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-6">
        <div className="text-center max-w-sm w-full">
          <div className="mb-8 space-y-3">
            {STEPS.map((s,i)=>(
              <div key={s} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background:i<=step?"var(--primary)":"var(--surface-alt)", transition:"background .4s" }}>
                  {i<=step&&<Icon name="check" size={11} color="#fff" strokeWidth={2.5}/>}
                </div>
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background:"var(--surface-alt)" }}>
                  <motion.div className="h-full rounded-full" style={{ background:"var(--primary)" }} initial={{ width:0 }} animate={{ width:i<=step?"100%":"0%" }} transition={{ duration:3, ease:"linear" }}/>
                </div>
                <p className="text-xs font-display font-bold" style={{ color:i<=step?"var(--text)":"var(--muted)", minWidth:"150px", textAlign:"left" }}>{s}</p>
              </div>
            ))}
          </div>
          <p className="label text-center" style={{ fontSize:"10px" }}>Reading the unsaid... (~20–60 seconds)</p>
        </div>
      </div>
    );
  }

  if (result?.status==="failed") return (
    <div className="flex items-center justify-center min-h-[80vh] px-6">
      <div className="card p-10 text-center max-w-sm">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background:"var(--red-soft)" }}>
          <Icon name="alert" size={24} color="var(--red)"/>
        </div>
        <h3 className="font-display text-lg font-bold mb-2" style={{ color:"var(--text)" }}>Analysis Failed</h3>
        <p className="mb-5 text-sm" style={{ color:"var(--muted)" }}>Something went wrong. Try again with a different file or paste the text directly.</p>
        <Link href="/analyze" className="btn btn-primary">Try Again</Link>
      </div>
    </div>
  );

  const s = result?.scores; if (!s) return null;
  const speakerA = result?.speakers?.a ?? "You";
  const speakerB = result?.speakers?.b ?? "Them";
  const variant  = scoreToVariant(s.overall_score);
  const verdict  = result?.genz_verdict ?? scoreToSlang(s.overall_score, s.ghosting_risk, s.toxicity_level);
  const oLabel   = scoreLabel(s.overall_score);
  const tVerd    = toxicityVerdict(s.toxicity_level);
  const gVerd    = ghostingVerdict(s.ghosting_risk);
  const aVerd    = attachmentVerdict(s.attachment_style);
  const vc       = VARIANT_CONFIG[variant];
  const dateStr  = formatDateRange(result?.date_range);
  const suggs    = getSuggestions(s, speakerA, speakerB);

  return (
    <div className="px-3 sm:px-5 md:px-8 py-4 md:py-8 max-w-2xl">

      {/* Back + Advisor */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <Link href="/reports" className="inline-flex items-center gap-1.5 label hover:text-primary transition-colors" style={{ fontSize:"9px" }}>
          <Icon name="back" size={12} color="var(--muted)"/>All Reports
        </Link>
        <Link href={`/advisor/${id}`} className="btn btn-secondary inline-flex items-center gap-2" style={{ fontSize:"11px", padding:"8px 16px" }}>
          <Icon name="message" size={13} color="var(--primary)"/>Ask AI Advisor
        </Link>
      </div>

      {/* Hero Score */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }} className="card mb-4 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <ScoreRing score={s.overall_score}/>
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded mb-2" style={{ background:"var(--pri-soft)", border:"1px solid var(--pri-border)" }}>
                <Icon name={vc.icon} size={12} color={vc.iconColor}/>
                <span className="label" style={{ fontSize:"9px", color:"var(--primary)" }}>{vc.label}</span>
              </div>
              <h1 className="font-display font-bold mb-1" style={{ fontSize:"clamp(1.3rem,5vw,1.75rem)", color:"var(--text)", lineHeight:1.1 }}>{speakerA} & {speakerB}</h1>
              <p className="text-sm leading-relaxed mb-2" style={{ color:"var(--muted)", fontStyle:"italic" }}>{verdict}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-display font-bold text-sm" style={{ color:oLabel.c }}>{oLabel.t}</span>
                {result?.message_count && <span className="label" style={{ fontSize:"9px" }}>{result.message_count} messages</span>}
                {dateStr && <span className="label" style={{ fontSize:"9px" }}>{dateStr}</span>}
              </div>
            </div>
          </div>
        </div>
        {/* Metric strip */}
        <div className="grid grid-cols-4" style={{ borderTop:"1px solid var(--line)", background:"var(--surface)" }}>
          {[
            { l:"Compat",   v:`${s.compatibility_score}%`, c:"var(--primary)" },
            { l:"Toxicity", v:s.toxicity_level,            c:SC[s.toxicity_level]??"var(--muted)" },
            { l:"Ghosting", v:s.ghosting_risk,             c:SC[s.ghosting_risk]??"var(--muted)" },
            { l:"Style",    v:s.attachment_style??"—",     c:"var(--text)" },
          ].map(m=>(
            <div key={m.l} className="text-center py-3 px-2" style={{ borderRight:"1px solid var(--line)" }}>
              <p className="font-display font-bold capitalize" style={{ fontSize:"clamp(11px,3vw,14px)", color:m.c }}>{m.v}</p>
              <p className="label mt-0.5" style={{ fontSize:"8px" }}>{m.l}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Download Score Card */}
      <Section title="Download Your Score Card" iconName="card" iconColor="var(--primary)">
        <p className="text-sm mb-4" style={{ color:"var(--muted)" }}>Your Auraxa score in a shareable card. Download it or share the link.</p>
        <DownloadableScoreCard result={result!}/>
      </Section>

      {/* AI Narrative */}
      {result?.ai_narrative && (
        <Section title="The Full Story" iconName="book" iconColor="var(--primary)">
          <p className="text-sm leading-relaxed" style={{ color:"var(--muted)", whiteSpace:"pre-line" }}>{result.ai_narrative}</p>
        </Section>
      )}

      {/* Toxicity */}
      <Section title="Toxicity Analysis" iconName={tVerd.icon} iconColor={tVerd.iconColor}>
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 mt-0.5"><StatusDot level={s.toxicity_level}/></div>
          <div>
            <p className="font-display font-bold text-sm mb-0.5" style={{ color:SC[s.toxicity_level]??"var(--muted)" }}>{tVerd.label}</p>
            <p className="text-xs italic mb-2" style={{ color:"var(--primary)" }}>"{tVerd.genZ}"</p>
            <p className="text-sm leading-relaxed" style={{ color:"var(--muted)" }}>{tVerd.explain}</p>
          </div>
        </div>
        <MetricBar label="Toxicity Level" value={s.toxicity_level==="low"?20:s.toxicity_level==="medium"?50:s.toxicity_level==="high"?80:95} color={SC[s.toxicity_level]??"var(--muted)"} delay={.2}/>
        {s.toxicity_level!=="low" && (
          <div className="mt-4 p-3 rounded" style={{ background:"var(--red-soft)", border:"1px solid rgba(204,0,0,.15)" }}>
            <div className="flex items-center gap-2 mb-1.5"><Icon name="info" size={13} color="var(--red)"/><p className="text-xs font-bold" style={{ color:"var(--red)" }}>What toxic patterns look like</p></div>
            <p className="text-xs leading-relaxed" style={{ color:"var(--muted)" }}>Stonewalling · Contempt · Defensiveness · Criticism · Gaslighting · Emotional withdrawal · Blame-shifting. If you see these repeatedly, it's a pattern worth addressing.</p>
          </div>
        )}
      </Section>

      {/* Compatibility */}
      <Section title="Compatibility Score" iconName="heart" iconColor="var(--primary)">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0 w-14 h-14 rounded flex items-center justify-center" style={{ background:"var(--pri-soft)" }}>
            <span className="font-display font-bold text-xl" style={{ color:"var(--primary)" }}>{s.compatibility_score}</span>
          </div>
          <div>
            <p className="font-display font-bold" style={{ color:scoreLabel(s.compatibility_score).c }}>{scoreLabel(s.compatibility_score).t} compatibility</p>
            <p className="text-xs" style={{ color:"var(--muted)" }}>{s.compatibility_score>=70?"Strong emotional resonance detected.":s.compatibility_score>=50?"Moderate alignment — gaps exist but potential is there.":"Significant barriers. Not impossible, but requires real work."}</p>
          </div>
        </div>
        <MetricBar label="Compatibility" value={s.compatibility_score} color="var(--primary)" delay={.1}/>
        <p className="text-xs mt-3 leading-relaxed" style={{ color:"var(--muted)" }}>Compatibility measures emotional alignment, communication similarity, and whether both people show up with equal energy. Above 65 — foundation worth building on. Below 50 — conscious work required from both sides.</p>
      </Section>

      {/* Ghosting Risk */}
      <Section title="Ghosting Risk" iconName={gVerd.icon} iconColor={gVerd.iconColor}>
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 mt-0.5"><StatusDot level={s.ghosting_risk}/></div>
          <div>
            <p className="font-display font-bold text-sm mb-0.5" style={{ color:SC[s.ghosting_risk]??"var(--muted)" }}>{gVerd.label}</p>
            <p className="text-xs italic mb-2" style={{ color:"var(--primary)" }}>"{gVerd.genZ}"</p>
            <p className="text-sm leading-relaxed" style={{ color:"var(--muted)" }}>{gVerd.explain}</p>
          </div>
        </div>
        <MetricBar label="Ghosting Risk" value={s.ghosting_risk==="low"?15:s.ghosting_risk==="medium"?55:90} color={SC[s.ghosting_risk]??"var(--muted)"} delay={.1}/>
      </Section>

      {/* Attachment */}
      <Section title="Attachment Style" iconName={aVerd.icon} iconColor={aVerd.iconColor}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ background:"var(--pri-soft)" }}>
            <Icon name={aVerd.icon} size={18} color={aVerd.iconColor}/>
          </div>
          <div>
            <p className="font-display font-bold capitalize" style={{ color:"var(--text)" }}>{s.attachment_style??"Secure"} Attachment</p>
            <p className="label" style={{ fontSize:"9px" }}>Detected from communication patterns</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed mb-3" style={{ color:"var(--muted)" }}>{aVerd.explain}</p>
        <div className="p-3 rounded flex gap-2.5" style={{ background:"var(--pri-soft)", border:"1px solid var(--pri-border)" }}>
          <Icon name="info" size={14} color="var(--primary)" strokeWidth={2}/>
          <p className="text-xs leading-relaxed" style={{ color:"var(--muted)" }}>{aVerd.suggestion}</p>
        </div>
      </Section>

      {/* Conversation Structure */}
      <Section title="Conversation Structure" iconName="barChart" iconColor="var(--primary)">
        <p className="text-sm font-bold mb-3" style={{ color:"var(--text)" }}>Who's talking more?</p>
        <div className="space-y-3 mb-3">
          <MetricBar label={speakerA} value={Math.round(s.speaker_a_percentage??50)} color="var(--primary)" delay={0}/>
          <MetricBar label={speakerB} value={Math.round(s.speaker_b_percentage??50)} color="#9b8cf0" delay={.1}/>
        </div>
        <p className="text-xs leading-relaxed mb-3" style={{ color:"var(--muted)" }}>
          {Math.abs((s.speaker_a_percentage??50)-(s.speaker_b_percentage??50))<15
            ? "Balanced conversation — both parties contributing roughly equally. Healthy sign."
            : `Uneven balance — ${(s.speaker_a_percentage??50)>50?speakerA:speakerB} is carrying significantly more of the dialogue.`}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded p-3 text-center" style={{ background:"var(--surface-alt)" }}>
            <p className="font-display font-bold text-lg" style={{ color:"var(--text)" }}>{result?.message_count??"—"}</p>
            <p className="label mt-0.5" style={{ fontSize:"9px" }}>Total Messages</p>
          </div>
          <div className="rounded p-3 text-center" style={{ background:"var(--surface-alt)" }}>
            <p className="font-display font-bold text-sm capitalize" style={{ color:"var(--primary)" }}>{s.attachment_style??"—"}</p>
            <p className="label mt-0.5" style={{ fontSize:"9px" }}>Attachment Style</p>
          </div>
        </div>
      </Section>

      {/* Timeline */}
      {result?.timeline && result.timeline.length>0 && (
        <Section title="Emotional Timeline" iconName="trend" iconColor="var(--primary)">
          <p className="text-xs mb-4" style={{ color:"var(--muted)" }}>Each bar = one message. Height = emotional intensity. Color = sentiment. Hover for details.</p>
          <TimelineChart points={result.timeline} speakerA={speakerA} speakerB={speakerB}/>
        </Section>
      )}

      {/* Patterns */}
      {s.patterns_detected?.length>0 && (
        <Section title="Patterns Detected" iconName="search" iconColor="var(--primary)">
          <p className="text-xs mb-4" style={{ color:"var(--muted)" }}>AI identified these recurring dynamics. Each gives you a lens to understand what's happening beneath the words.</p>
          <div className="flex flex-wrap gap-2">
            {s.patterns_detected.map(p=>(
              <span key={p} className="px-3 py-1.5 rounded font-display font-bold text-xs" style={{ background:"var(--surface-alt)", color:"var(--text)", border:"1px solid var(--line)" }}>{p}</span>
            ))}
          </div>
        </Section>
      )}

      {/* What To Do */}
      <Section title="What You Can Do" iconName="tool" iconColor="var(--primary)" accent>
        <p className="text-xs mb-4" style={{ color:"var(--muted)" }}>Actionable steps tailored to your specific situation:</p>
        <div className="space-y-3">
          {suggs.map((sg,i)=>(
            <motion.div key={i} initial={{ opacity:0, x:-10 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*.08 }} className="flex gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background:"var(--primary)", minWidth:"20px" }}>
                <span style={{ color:"#fff", fontSize:"10px", fontWeight:700 }}>{i+1}</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color:"var(--muted)" }}>{sg}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Therapist Note */}
      <Section title="A Note For You" iconName="brain" iconColor="var(--primary)">
        <div className="space-y-3">
          <p className="text-sm leading-relaxed" style={{ color:"var(--text)", fontStyle:"italic" }}>
            "Every conversation you've ever had has shaped how you communicate today. The fact that you're here — seeking clarity, trying to understand — that already puts you ahead of most people."
          </p>
          <p className="text-sm leading-relaxed" style={{ color:"var(--muted)" }}>
            Relationships are complex systems. A score can point you toward patterns, but it can't tell you what to feel about them. What AI can do is surface the invisible — the things you sensed but couldn't articulate.
          </p>
          <p className="text-sm leading-relaxed" style={{ color:"var(--muted)" }}>
            {s.overall_score>=65
              ? `Your score of ${s.overall_score} reflects something genuinely worth nurturing. Don't let anxiety erode what the data shows is working.`
              : s.overall_score>=40
              ? `Your score of ${s.overall_score} sits in the honest middle. There are real strengths and real challenges. Decide which battles matter.`
              : `Your score of ${s.overall_score} deserves your full attention — not panic, but honest reflection. You deserve connections that don't leave you feeling depleted.`}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Icon name="heart" size={14} color="var(--primary)"/>
            <p className="text-sm font-semibold" style={{ color:"var(--text)" }}>You are not overreacting. You are not too much. You are figuring it out.</p>
          </div>
        </div>
      </Section>

      {/* Talk To A Real Person */}
      <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="card mb-4 overflow-hidden"
        style={{ background:"linear-gradient(135deg,#f8f7ff 0%,#f0fdf4 100%)", border:"1px solid var(--pri-border)" }}>
        <div className="px-4 sm:px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-base" style={{ background:"#1e1a2e", color:"#fff" }}>A</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Icon name="users" size={14} color="var(--primary)"/>
                <p className="font-display font-bold text-sm" style={{ color:"var(--text)" }}>Need to talk to a real person?</p>
              </div>
              <p className="label mb-3" style={{ fontSize:"9px" }}>Sometimes data isn't enough — and that's okay.</p>
              <p className="text-sm leading-relaxed mb-4" style={{ color:"var(--muted)" }}>
                If you need to process what you're feeling with someone real — not an AI — I'm here. I built Auraxa because I believe everyone deserves to understand their relationships better. DM me, no judgment.
              </p>
              <a href="https://instagram.com/iaddy29" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded font-display font-bold text-xs"
                style={{ background:"linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)", color:"#fff", textDecoration:"none", letterSpacing:"0.04em" }}>
                <Icon name="instagram" size={15} color="#fff"/>
                @iaddy29 on Instagram
              </a>
              <p className="text-xs mt-2" style={{ color:"var(--muted)" }}>Or just slide into my DMs. I actually reply.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Gen Z Card */}
      <Section title="Your Gen Z Score Card" iconName="zap" iconColor="var(--primary)">
        <p className="text-sm mb-4" style={{ color:"var(--muted)" }}>The shareable version. Download and post it.</p>
        <GenZCard score={s.overall_score} verdict={verdict} compatibility={s.compatibility_score}
          ghostingRisk={s.ghosting_risk} toxicity={s.toxicity_level}
          speakerA={speakerA} speakerB={speakerB} variant={variant} showDownload/>
      </Section>

      {/* Footer */}
      <div className="text-center py-6 flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5">
          <Icon name="heart" size={12} color="var(--primary)"/>
          <p className="label" style={{ fontSize:"9px" }}>Built by Aditya</p>
        </div>
        <p className="text-xs" style={{ color:"var(--muted)" }}>AI-powered and for informational purposes. Not a substitute for professional therapy.</p>
      </div>

    </div>
  );
}
