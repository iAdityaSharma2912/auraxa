"use client";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

// ─── Particle Canvas ─────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    let w = c.width = c.offsetWidth, h = c.height = c.offsetHeight;
    const pts = Array.from({ length: 80 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      sz: Math.random() * 1.5 + .3,
      dx: (Math.random() - .5) * .3, dy: (Math.random() - .5) * .3,
      o: Math.random() * .25 + .05,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // Lines between nearby points
      pts.forEach((a, i) => {
        pts.slice(i + 1).forEach(b => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(108,85,224,${(.12 * (1 - d / 120)).toFixed(3)})`;
            ctx.lineWidth = .5; ctx.stroke();
          }
        });
        a.x += a.dx; a.y += a.dy;
        if (a.x < 0 || a.x > w) a.dx *= -1;
        if (a.y < 0 || a.y > h) a.dy *= -1;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(108,85,224,${a.o})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    const onResize = () => { w = c.width = c.offsetWidth; h = c.height = c.offsetHeight; };
    window.addEventListener("resize", onResize, { passive: true });
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none"/>;
}

// ─── Animated Score Counter ───────────────────────────────
function AnimatedScore({ target, delay = 0 }: { target: number; delay?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let start = 0;
      const step = target / 60;
      const interval = setInterval(() => {
        start = Math.min(start + step, target);
        setVal(Math.round(start));
        if (start >= target) clearInterval(interval);
      }, 16);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return <>{val}</>;
}

// ─── Live Score Card Demo ─────────────────────────────────
function ScoreDemo() {
  const [active, setActive] = useState(0);
  const demos = [
    { score: 74, label: "Healing Arc", verdict: "healing arc unlocked. the effort is there, just gotta communicate bestie", a: "Addy", b: "Priya", compat: "68%", tox: "Low", ghost: "Medium", bg: "#f8f7ff", clr: "#6c55e0" },
    { score: 38, label: "Mid Energy",  verdict: "it's giving situationship energy. potential is there but we need to talk", a: "Rahul", b: "Sneha", compat: "42%", tox: "Medium", ghost: "High",   bg: "#fff8ee", clr: "#b45309" },
    { score: 91, label: "Slay Era",    verdict: "slay coded, main character era fr. understood the assignment no cap",     a: "Dev",   b: "Aisha", compat: "88%", tox: "Low",    ghost: "Low",    bg: "#f0fdf4", clr: "#047857" },
  ];
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % demos.length), 3500);
    return () => clearInterval(t);
  }, []);
  const d = demos[active];
  return (
    <AnimatePresence mode="wait">
      <motion.div key={active} initial={{ opacity: 0, y: 12, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .97 }}
        transition={{ duration: .4, ease: [.16, 1, .3, 1] }}
        style={{ background: d.bg, borderRadius: "12px", padding: "24px", border: `1px solid ${d.clr}22`, fontFamily: "'Inter',sans-serif" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "9px", fontWeight: 800, letterSpacing: "0.2em", color: "rgba(0,0,0,.2)", textTransform: "uppercase" }}>AURAXA</span>
          <span style={{ fontSize: "9px", fontFamily: "'Montserrat',sans-serif", fontWeight: 600, color: "rgba(0,0,0,.28)", letterSpacing: "0.06em" }}>{d.a.toUpperCase()} × {d.b.toUpperCase()}</span>
        </div>
        {/* Score */}
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "72px", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em", color: d.clr, marginBottom: "6px" }}>{d.score}</div>
        {/* Verdict */}
        <div style={{ fontSize: "12px", lineHeight: 1.45, color: "rgba(0,0,0,.6)", marginBottom: "16px" }}>{d.verdict}</div>
        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
          {[{ l: "Compat", v: d.compat }, { l: "Toxicity", v: d.tox }, { l: "Ghost", v: d.ghost }].map(m => (
            <div key={m.l} style={{ background: "rgba(0,0,0,.04)", borderRadius: "5px", padding: "7px 8px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "7px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(0,0,0,.3)", marginBottom: "2px" }}>{m.l}</div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "12px", fontWeight: 700, color: d.clr }}>{m.v}</div>
            </div>
          ))}
        </div>
        {/* Footer */}
        <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "7px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", paddingTop: "10px", marginTop: "12px", borderTop: "1px solid rgba(0,0,0,.08)", color: "rgba(0,0,0,.2)", display: "flex", justifyContent: "space-between" }}>
          <span>auraxa.app</span><span>no cap, all data</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Section reveal ───────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: .08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(20px)", transition: `opacity .6s ease ${delay}s, transform .6s ease ${delay}s` }}>
      {children}
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────
function Feature({ n, title, desc, icon }: { n: string; title: string; desc: string; icon: string }) {
  return (
    <div className="card p-5 h-full group" style={{ transition: "transform .2s, box-shadow .2s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-lg)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}>
      <div className="text-2xl mb-3">{icon}</div>
      <p className="font-mono text-xs mb-2" style={{ color: "var(--primary)" }}>{n}</p>
      <h3 className="font-display font-bold text-base mb-2" style={{ color: "var(--text)" }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{desc}</p>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────
export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, -60]);

  const STATS = [
    { value: 15000, label: "Chats analysed" },
    { value: 98,    label: "% accuracy" },
    { value: 60,    label: "Seconds avg" },
  ];

  const FEATURES = [
    { n: "01", icon: "◫", title: "Chat Analyser", desc: "WhatsApp, Telegram, Instagram, iMessage. Upload a screenshot or paste text. Full emotional scoring in 60 seconds." },
    { n: "02", icon: "◈", title: "Astrology Engine", desc: "Cross-reference your birth chart with your actual text patterns. Cosmic compatibility meets real behavioural data." },
    { n: "03", icon: "▦", title: "Gen Z Cards", desc: "Shareable score cards with your Auraxa verdict. Slay era, healing arc, cooked — your relationship in one card." },
    { n: "04", icon: "◇", title: "AI Advisor", desc: "Chat with an AI that's already read your conversation. Context-aware guidance, not generic advice." },
    { n: "05", icon: "✋", title: "Palm Reading", desc: "Upload a photo of your hand. AI reads your heart line, head line, and life line in seconds." },
    { n: "06", icon: "▤", title: "Full Reports", desc: "Toxicity deep-dive, ghosting risk, attachment style, conversation balance, emotional timeline." },
  ];

  const TESTIMONIALS = [
    { q: "The moment I saw the results, I understood six months of confusion in five minutes.", n: "Priya S.", loc: "Delhi" },
    { q: "It found the exact week things changed. I didn't even know that was possible with just texts.", n: "Arjun M.", loc: "Bengaluru" },
    { q: "The ghosting risk section was uncomfortably accurate. Like it knew before I did.", n: "Neha R.", loc: "Mumbai" },
    { q: "I sent my bestie her score card and we spent 3 hours talking about it. So validating.", n: "Tanvi K.", loc: "Pune" },
  ];

  const [tIdx, setTIdx] = useState(0);
  useEffect(() => { const t = setInterval(() => setTIdx(i => (i + 1) % TESTIMONIALS.length), 4500); return () => clearInterval(t); }, []);

  return (
    <main style={{ background: "var(--bg)", overflowX: "hidden" }}>

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 md:px-10 py-4 glass-strong" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="sm" showTagline={false}/>
          <nav className="hidden md:flex items-center gap-8">
            {[["#features","Features"],["#how","How It Works"],["#proof","Reviews"]].map(([href,label]) => (
              <a key={href} href={href} className="label hover:text-primary transition-colors" style={{ fontSize: "10px" }}>{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="label hidden sm:block" style={{ fontSize: "10px", color: "var(--muted)" }}>Sign In</Link>
            <Link href="/login" className="btn btn-primary" style={{ padding: "9px 18px", fontSize: "11px" }}>
              Analyse Free →
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden" style={{ paddingTop: "72px" }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #f8f7ff 0%, #ffffff 60%)" }}/>
        <ParticleCanvas/>

        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — copy */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded mb-6"
                style={{ background: "var(--pri-soft)", border: "1px solid var(--pri-border)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }}/>
                <span className="label" style={{ fontSize: "10px", color: "var(--primary)" }}>AI Relationship Intelligence</span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .18 }}
                className="font-display font-bold mb-5" style={{ fontSize: "clamp(2.4rem,6vw,4.5rem)", lineHeight: 1.04, letterSpacing: "-0.03em", color: "var(--text)" }}>
                Feel what your<br/><span style={{ color: "var(--primary)" }}>texts can't say.</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .26 }}
                className="text-base sm:text-lg leading-relaxed mb-8" style={{ color: "var(--muted)", maxWidth: "480px" }}>
                Upload any chat. Get your emotional health score, compatibility rating, ghosting risk, and a shareable Gen Z card — in 60 seconds.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .34 }}
                className="flex flex-wrap gap-3 mb-8">
                <Link href="/login" className="btn btn-primary" style={{ padding: "13px 28px", fontSize: "13px" }}>
                  Analyse yours — it's free
                </Link>
                <a href="#features" className="btn btn-secondary" style={{ padding: "13px 22px", fontSize: "13px" }}>
                  See how it works
                </a>
              </motion.div>

              {/* Stats */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5 }}
                className="flex gap-8 flex-wrap">
                {STATS.map((s, i) => (
                  <div key={s.label}>
                    <p className="font-display font-bold" style={{ fontSize: "1.5rem", color: "var(--text)", lineHeight: 1 }}>
                      <AnimatedScore target={s.value} delay={600 + i * 150}/>
                      {s.label === "% accuracy" ? "%" : s.label === "Seconds avg" ? "s" : "+"}
                    </p>
                    <p className="label mt-1" style={{ fontSize: "9px" }}>{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — score card demo */}
            <motion.div initial={{ opacity: 0, scale: .94, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ delay: .3, duration: .7, ease: [.16,1,.3,1] }}
              className="relative">
              {/* Glow behind card */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(108,85,224,.15) 0%, transparent 70%)", transform: "scale(1.2)" }}/>
              <ScoreDemo/>
              {/* Floating badge */}
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 card px-3 py-2 flex items-center gap-2 shadow-lg"
                style={{ background: "var(--bg)" }}>
                <span style={{ fontSize: "16px" }}>🔮</span>
                <div>
                  <p className="font-display font-bold" style={{ fontSize: "11px", color: "var(--text)" }}>AI Analysed</p>
                  <p className="label" style={{ fontSize: "8px" }}>Real patterns detected</p>
                </div>
              </motion.div>
              <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: .5 }}
                className="absolute -bottom-4 -left-4 card px-3 py-2 flex items-center gap-2 shadow-lg"
                style={{ background: "var(--bg)" }}>
                <span style={{ fontSize: "14px" }}>📊</span>
                <p className="font-display font-bold" style={{ fontSize: "11px", color: "var(--text)" }}>15k+ chats analysed</p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce" style={{ opacity: .4 }}>
          <p className="label" style={{ fontSize: "8px" }}>SCROLL</p>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </section>

      {/* ── PLATFORMS ── */}
      <section className="py-8 px-4 sm:px-6" style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-center flex-wrap gap-3 sm:gap-6">
          <p className="label" style={{ fontSize: "9px", color: "var(--muted-2)" }}>WORKS WITH</p>
          {["WhatsApp", "Telegram", "Instagram", "iMessage", "Snapchat", "Any chat"].map(p => (
            <span key={p} className="px-3 py-1.5 rounded font-display font-bold"
              style={{ background: "var(--bg)", border: "1px solid var(--line)", fontSize: "11px", color: "var(--muted)", letterSpacing: "0.04em" }}>
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-14">
            <p className="label mb-3" style={{ fontSize: "10px", color: "var(--primary)" }}>THE PROCESS</p>
            <h2 className="font-display font-bold" style={{ fontSize: "clamp(1.6rem,4vw,2.8rem)", color: "var(--text)" }}>
              Four steps to clarity
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n:"01", icon:"↑", title:"Upload", desc:"Screenshot, .txt, or paste any conversation. Up to 3 files." },
              { n:"02", icon:"◈", title:"Analyse", desc:"AI decodes emotional patterns, attachment styles, and hidden signals in seconds." },
              { n:"03", icon:"▦", title:"Score", desc:"Compatibility, ghosting risk, toxicity — all scored 0–100 with context." },
              { n:"04", icon:"◇", title:"Share", desc:"Download your Gen Z score card. Every share spreads the word." },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * .08}>
                <div className="card p-5 text-center h-full">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold" style={{ background: "var(--pri-soft)", color: "var(--primary)" }}>
                    {s.icon}
                  </div>
                  <p className="font-mono text-xs mb-1" style={{ color: "var(--primary)" }}>{s.n}</p>
                  <h3 className="font-display font-bold text-base mb-2" style={{ color: "var(--text)" }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 sm:py-32 px-4 sm:px-6" style={{ background: "var(--surface)" }}>
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <p className="label mb-3" style={{ fontSize: "10px", color: "var(--primary)" }}>EVERYTHING INCLUDED</p>
            <h2 className="font-display font-bold mb-3" style={{ fontSize: "clamp(1.6rem,4vw,2.8rem)", color: "var(--text)" }}>
              Built for real answers
            </h2>
            <p className="text-base" style={{ color: "var(--muted)", maxWidth: "480px", margin: "0 auto" }}>
              Not a vibe check. Actual emotional intelligence analysis backed by AI.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.n} delay={i * .06}>
                <Feature {...f}/>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── DARK CTA SECTION ── */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 relative overflow-hidden" style={{ background: "#1e1a2e" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(108,85,224,.3) 0%, transparent 70%)" }}/>
        <Reveal className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="label mb-4" style={{ fontSize: "10px", color: "rgba(255,255,255,.35)" }}>THE TRUTH IS IN THE TEXTS</p>
          <h2 className="font-display font-bold mb-4" style={{ fontSize: "clamp(1.8rem,5vw,3.2rem)", color: "#fff", lineHeight: 1.08, letterSpacing: "-0.02em" }}>
            What are your messages<br/>
            <span style={{ color: "#8b74f7" }}>actually saying?</span>
          </h2>
          <p className="text-base mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,.5)", maxWidth: "460px", margin: "0 auto 2rem" }}>
            Every text you've sent has a pattern. Auraxa finds it. No judgment — just data.
          </p>
          <Link href="/login" className="btn" style={{ background: "var(--primary)", color: "#fff", padding: "14px 32px", fontSize: "14px" }}>
            Analyse yours — it's free →
          </Link>
          <p className="label mt-4" style={{ fontSize: "9px", color: "rgba(255,255,255,.25)" }}>
            No credit card · 3 free analyses · Takes 60 seconds
          </p>
        </Reveal>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="proof" className="py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <Reveal>
            <p className="label mb-3" style={{ fontSize: "10px", color: "var(--primary)" }}>REAL PEOPLE, REAL RECEIPTS</p>
            <h2 className="font-display font-bold mb-10" style={{ fontSize: "clamp(1.5rem,4vw,2.2rem)", color: "var(--text)" }}>
              The receipts don't lie
            </h2>
          </Reveal>
          <div className="relative" style={{ minHeight: "180px" }}>
            <AnimatePresence mode="wait">
              {TESTIMONIALS.map((t, i) => i === tIdx && (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .4 }}
                  className="card p-7 sm:p-10">
                  <div className="text-3xl mb-4" style={{ color: "var(--pri-soft)", fontFamily: "Georgia, serif" }}>"</div>
                  <p className="text-base sm:text-lg leading-relaxed mb-5" style={{ color: "var(--text)" }}>{t.q}</p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-display" style={{ background: "var(--pri-soft)", color: "var(--primary)" }}>
                      {t.n[0]}
                    </div>
                    <div className="text-left">
                      <p className="font-display font-bold text-sm" style={{ color: "var(--text)" }}>{t.n}</p>
                      <p className="label" style={{ fontSize: "9px" }}>{t.loc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-2 mt-5">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setTIdx(i)} aria-label={`Review ${i+1}`}
                style={{ width: i === tIdx ? 24 : 8, height: 8, borderRadius: 4, background: i === tIdx ? "var(--primary)" : "var(--line-2)", border: "none", cursor: "pointer", padding: 0, transition: "all .25s" }}/>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 sm:py-32 px-4 sm:px-6" style={{ background: "var(--surface)" }}>
        <Reveal>
          <div className="max-w-xl mx-auto card p-10 sm:p-14 text-center" style={{ background: "var(--bg)" }}>
            <div className="text-3xl mb-4">🔮</div>
            <h2 className="font-display font-bold mb-3" style={{ fontSize: "clamp(1.4rem,4vw,1.875rem)", color: "var(--text)" }}>
              Decode yours now.
            </h2>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--muted)" }}>
              Three free analyses. No credit card. No judgment. Just truth.
            </p>
            <Link href="/login" className="btn btn-primary w-full" style={{ padding: "14px", fontSize: "13px" }}>
              Start for free →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-4 sm:px-6 md:px-10" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size="sm" showTagline={false}/>
          <p className="label text-center" style={{ fontSize: "9px" }}>© 2026 Auraxa · Built by <a href="https://instagram.com/iaddy29" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>@iaddy29</a></p>
          <div className="flex gap-6">
            {[["Privacy","/privacy"],["Terms","/terms"],["Instagram","https://instagram.com/iaddy29"]].map(([l,h]) => (
              <a key={l} href={h} target={h.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                className="label hover:text-primary transition-colors" style={{ fontSize: "9px" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
