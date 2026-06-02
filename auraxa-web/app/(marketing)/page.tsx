"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

const ROTATING_WORDS = ["Relationships.", "Conversations.", "Connections.", "Emotions.", "Patterns.", "Silence."];

const FEATURES = [
  { num: "01", title: "Emotional AI", desc: "Decode attachment styles, ghosting signals, and unspoken dynamics from any conversation." },
  { num: "02", title: "Astrology Engine", desc: "Birth chart analysis meets conversation data. Understand the cosmic blueprint behind your bonds." },
  { num: "03", title: "Palm Reading", desc: "Upload your palm. Our vision AI reads heart, head, and life lines for relationship insights." },
  { num: "04", title: "AI Advisor", desc: "Ask anything about your analysis. Answers grounded in your actual conversation patterns." },
];

const STATS = [
  { n: "14,700+", label: "Readings Complete" },
  { n: "92%",     label: "Accuracy Reported" },
  { n: "3",       label: "AI Providers" },
  { n: "60s",     label: "Average Read Time" },
];

const TESTIMONIALS = [
  { quote: "The moment I saw the results, I understood six months of confusion in five minutes.", name: "Priya S.", city: "Delhi" },
  { quote: "It found the exact week things changed. I didn't even know that was possible.", name: "Arjun M.", city: "Bengaluru" },
  { quote: "The astrology compatibility section genuinely changed how I see our dynamic.", name: "Neha R.", city: "Mumbai" },
];

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function WordRotator() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ROTATING_WORDS.length), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative inline-block" style={{ color: "#3457d5" }}>
      <AnimatePresence mode="wait">
        <motion.span key={idx}
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.4 }} className="inline-block">
          {ROTATING_WORDS[idx]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function AnimatedStat({ n, label }: { n: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setShown(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="text-center">
      <motion.p initial={{ opacity: 0, y: 12 }} animate={shown ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
        className="font-display text-3xl md:text-4xl font-bold" style={{ color: "#171a20" }}>{n}</motion.p>
      <p className="label mt-1">{label}</p>
    </div>
  );
}

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const textY = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const [tIdx, setTIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTIdx(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="relative overflow-x-hidden">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 glass">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-5">
            <Link href="/login" className="label hover:text-text transition-colors">Sign In</Link>
            <Link href="/login" className="btn btn-primary" style={{ padding: "10px 22px", fontSize: "12px" }}>Begin Reading</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 pt-24">
        <motion.div style={{ y: textY }} className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded surface mb-8">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#3457d5" }} />
            <span className="label" style={{ color: "#5c5e62" }}>AI · Astrology · Palmistry</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
            className="font-display text-display-xl mb-2" style={{ color: "#171a20" }}>
            Decode your
          </motion.h1>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }}
            className="font-display text-display-xl mb-6">
            <WordRotator />
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "#5c5e62" }}>
            Ancient cosmic wisdom meets modern AI. Upload any conversation and discover the emotional intelligence hidden within every word.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <Link href="/login" className="btn btn-primary">Begin Your Reading →</Link>
            <Link href="#features" className="btn btn-secondary">See Features</Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
            className="flex items-center justify-center gap-4 label">
            <span>Free · 3 Analyses</span>
            <span style={{ color: "var(--line)" }}>|</span>
            <span>No Credit Card</span>
            <span style={{ color: "var(--line)" }}>|</span>
            <span>60s Results</span>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-px h-10 animate-scroll" style={{ background: "linear-gradient(to bottom, rgba(52,87,213,0.4), transparent)" }} />
          <span className="label" style={{ fontSize: "9px" }}>Scroll</span>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.07}>
              <div className="card card-hover p-6">
                <AnimatedStat n={s.n} label={s.label} />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="label mb-3" style={{ color: "#3457d5" }}>Capabilities</p>
            <h2 className="font-display text-display-lg mb-4" style={{ color: "#171a20" }}>Beyond the Surface</h2>
            <p className="text-lg max-w-lg mx-auto" style={{ color: "#5c5e62" }}>
              Every conversation hides truths your eyes miss. Auraxa surfaces them all.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <div className="card card-hover p-6 h-full">
                  <p className="font-mono text-sm mb-4" style={{ color: "#3457d5" }}>{f.num}</p>
                  <h3 className="font-display text-base font-semibold mb-2" style={{ color: "#171a20" }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#5c5e62" }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <Reveal className="text-center mb-12">
            <p className="label mb-3" style={{ color: "#3457d5" }}>Voices</p>
            <h2 className="font-display text-display-md" style={{ color: "#171a20" }}>Real Revelations</h2>
          </Reveal>
          <div className="relative min-h-[180px]">
            <AnimatePresence mode="wait">
              {TESTIMONIALS.map((t, i) => i === tIdx && (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5 }} className="card p-10 text-center">
                  <p className="text-xl leading-relaxed mb-6" style={{ color: "#171a20" }}>"{t.quote}"</p>
                  <div>
                    <p className="font-display font-semibold text-sm" style={{ color: "#171a20" }}>{t.name}</p>
                    <p className="label mt-0.5">{t.city}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="flex justify-center gap-2 mt-6">
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setTIdx(i)} aria-label={`Testimonial ${i + 1}`}
                  className="rounded-full transition-all duration-300"
                  style={{ width: i === tIdx ? 24 : 8, height: 8, background: i === tIdx ? "#3457d5" : "rgba(0,0,0,.15)" }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center card p-14" style={{ background: "#171a20" }}>
            <p className="label mb-3" style={{ color: "#8a8d92" }}>Ancient Wisdom · Modern Intelligence</p>
            <h2 className="font-display text-display-md mb-4" style={{ color: "#ffffff" }}>Enter Your Oracle</h2>
            <p className="mb-8" style={{ color: "#b4b6ba" }}>Three free readings. No card required.</p>
            <Link href="/login" className="btn" style={{ background: "#fff", color: "#171a20" }}>Begin Free Reading →</Link>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-10 px-6" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" showTagline={false} />
          <p className="label">© 2026 AURAXA</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="label hover:text-text transition-colors">Privacy</Link>
            <Link href="/terms" className="label hover:text-text transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
