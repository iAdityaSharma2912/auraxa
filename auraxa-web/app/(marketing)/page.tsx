"use client";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let w = canvas.width = canvas.offsetWidth;
    let h = canvas.height = canvas.offsetHeight;
    const pts = Array.from({ length: 50 }, () => ({
      x:Math.random()*w, y:Math.random()*h, sz:Math.random()*1.8+.4,
      dx:(Math.random()-.5)*.25, dy:(Math.random()-.5)*.25, o:Math.random()*.3+.07,
    }));
    let raf: number;
    const frame = () => {
      ctx.clearRect(0,0,w,h);
      pts.forEach(p => {
        p.x+=p.dx; p.y+=p.dy;
        if(p.x<0||p.x>w) p.dx*=-1; if(p.y<0||p.y>h) p.dy*=-1;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);
        ctx.fillStyle=`rgba(108,85,224,${p.o})`; ctx.fill();
      });
      raf=requestAnimationFrame(frame);
    };
    const onResize=()=>{w=canvas.width=canvas.offsetWidth;h=canvas.height=canvas.offsetHeight;};
    window.addEventListener("resize",onResize,{passive:true});
    frame();
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",onResize);};
  },[]);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none"/>;
}

const DEMO=[
  {label:"Emotional Health",value:"74",sub:"↑ Trending",color:"#6c55e0"},
  {label:"Compatibility",value:"68%",sub:"Moderate",color:"#1e1a2e"},
  {label:"Ghost Risk",value:"Medium",sub:"3 signals",color:"#b45309"},
  {label:"Toxicity",value:"Low",sub:"No red flags",color:"#047857"},
];

const PLATFORMS=["WhatsApp","Telegram","Instagram","iMessage","Snapchat"];

const FEATURES=[
  {n:"01",t:"Chat Analyzer",d:"WhatsApp, Telegram, Instagram, iMessage. Full scoring in 60s."},
  {n:"02",t:"Gen Z Cards",d:"Shareable score cards with your Auraxa score and Gen Z verdict."},
  {n:"03",t:"Cosmic Verdict",d:"Cross-reference planetary compatibility with your actual patterns."},
];

const TESTIMONIALS=[
  {q:"The moment I saw the results, I understood six months of confusion in five minutes.",n:"Priya S.",c:"Delhi"},
  {q:"It found the exact week things changed. I didn't even know that was possible.",n:"Arjun M.",c:"Bengaluru"},
  {q:"The astrology section genuinely changed how I see our dynamic.",n:"Neha R.",c:"Mumbai"},
];

function Reveal({children,delay=0,className=""}:{children:React.ReactNode;delay?:number;className?:string}) {
  const ref=useRef<HTMLDivElement>(null); const [vis,setVis]=useState(false);
  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting)setVis(true)},{threshold:.08});
    if(ref.current)obs.observe(ref.current); return()=>obs.disconnect();
  },[]);
  return <div ref={ref} className={className} style={{opacity:vis?1:0,transform:vis?"none":"translateY(16px)",transition:`opacity .5s ease ${delay}s, transform .5s ease ${delay}s`}}>{children}</div>;
}

export default function HomePage() {
  const [tIdx,setTIdx]=useState(0);
  useEffect(()=>{const t=setInterval(()=>setTIdx(i=>(i+1)%TESTIMONIALS.length),5000);return()=>clearInterval(t);},[]);

  return (
    <main style={{ background:"var(--bg)", overflowX:"hidden" }}>
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 sm:py-4 glass" style={{ borderBottom:"1px solid var(--line)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo size="sm"/>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login" className="label text-xs hidden sm:block" style={{ color:"var(--muted)" }}>Sign In</Link>
            <Link href="/login" className="btn btn-primary" style={{ padding:"8px 14px", fontSize:"11px" }}>Analyse free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16 sm:pt-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0"><ParticleCanvas/></div>
        <div className="relative z-10 max-w-5xl mx-auto w-full py-10 sm:py-16">
          {/* Stack on mobile, side-by-side on desktop */}
          <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-12 items-start md:items-center">
            {/* Left */}
            <div>
              <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.1}}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded mb-6" style={{border:"1px solid var(--line-2)",background:"var(--surface)"}}>
                <span style={{color:"var(--primary)",fontSize:"13px"}}>✦</span>
                <span className="label" style={{fontSize:"10px"}}>Emotional Intelligence Platform</span>
              </motion.div>

              <motion.h1 initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.2}}
                className="font-display font-bold mb-4" style={{fontSize:"clamp(2rem,8vw,4.5rem)",lineHeight:1.04,letterSpacing:"-.03em",color:"var(--text)"}}>
                Feel The <span style={{color:"var(--primary)"}}>Unsaid.</span>
              </motion.h1>

              <motion.p initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.3}}
                className="text-base sm:text-lg leading-relaxed mb-6 sm:mb-8" style={{color:"var(--muted)",maxWidth:"480px"}}>
                Upload your chats. Get compatibility scores, Gen Z shareable cards, and AI relationship insights in under 60 seconds.
              </motion.p>

              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.4}} className="flex flex-wrap gap-3 mb-5">
                <Link href="/login" className="btn btn-primary">Analyse free</Link>
                <a href="#how-it-works" className="btn btn-secondary">How it works</a>
              </motion.div>

              <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.55}} className="label mb-4" style={{fontSize:"10px"}}>
                No credit card · Google signup · Private & secure
              </motion.p>

              {/* Platform pills — wrap on mobile */}
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.65}} className="flex flex-wrap gap-2">
                {PLATFORMS.map(p=>(
                  <span key={p} className="px-2.5 py-1 rounded text-xs" style={{background:"var(--surface-alt)",border:"1px solid var(--line)",color:"var(--muted)",fontFamily:"var(--font-display)",fontWeight:600,letterSpacing:"0.04em"}}>{p}</span>
                ))}
              </motion.div>
            </div>

            {/* Right — score band + card (below text on mobile) */}
            <motion.div initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} transition={{delay:.35,duration:.6}} className="w-full">
              {/* Score band */}
              <div className="card mb-3 overflow-hidden">
                <div className="grid grid-cols-2 sm:grid-cols-4" style={{gap:"1px",background:"var(--line)"}}>
                  {DEMO.map(s=>(
                    <div key={s.label} style={{background:"var(--bg)",padding:"12px 14px"}}>
                      <div className="label mb-1" style={{fontSize:"8px"}}>{s.label}</div>
                      <div className="font-display font-bold" style={{fontSize:"clamp(16px,4vw,22px)",color:s.color,lineHeight:1}}>{s.value}</div>
                      <div style={{fontSize:"9px",color:s.color==="1e1a2e"?"var(--muted)":s.color,marginTop:"3px",fontFamily:"var(--font-display)",fontWeight:600}}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-4 sm:p-5" style={{background:"#f8f7ff",border:"1px solid rgba(108,85,224,.2)"}}>
                <div style={{fontFamily:"'Montserrat',sans-serif",fontSize:"9px",fontWeight:800,letterSpacing:"0.2em",color:"rgba(0,0,0,.2)",textTransform:"uppercase",marginBottom:"10px"}}>AURAXA</div>
                <div style={{fontSize:"11px",color:"rgba(0,0,0,.3)",marginBottom:"12px",fontFamily:"'Montserrat',sans-serif",fontWeight:600,letterSpacing:"0.06em"}}>YOU × THEM</div>
                <div style={{fontFamily:"'Montserrat',sans-serif",fontSize:"clamp(48px,12vw,68px)",fontWeight:800,lineHeight:1,color:"#6c55e0",marginBottom:"6px"}}>74</div>
                <div style={{fontSize:"13px",lineHeight:1.45,color:"#3b3060",marginBottom:"12px"}}>healing arc unlocked. the effort is there, just gotta communicate bestie</div>
                <div style={{fontSize:"9px",fontFamily:"'Montserrat',sans-serif",fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",paddingTop:"10px",borderTop:"1px solid rgba(0,0,0,.09)",color:"rgba(0,0,0,.25)"}}>analyzed by auraxa.app · no cap, all data</div>
              </div>
              <p className="label mt-2 text-center" style={{fontSize:"9px",color:"var(--muted)"}}>↑ Live demo · Analyze yours, no cap</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-10 sm:mb-14">
            <p className="label mb-3" style={{fontSize:"10px",color:"var(--primary)"}}>What we do</p>
            <h2 className="font-display font-bold" style={{fontSize:"clamp(1.5rem,5vw,2.5rem)",color:"var(--text)"}}>Everything you need</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {FEATURES.map((f,i)=>(
              <Reveal key={f.n} delay={i*.07}>
                <div className="card p-5 h-full">
                  <p className="font-mono text-sm mb-3" style={{color:"var(--primary)"}}>{f.n}</p>
                  <h3 className="font-display text-base font-bold mb-2" style={{color:"var(--text)"}}>{f.t}</h3>
                  <p className="text-sm leading-relaxed" style={{color:"var(--muted)"}}>{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6" style={{background:"var(--surface)"}}>
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-10">
            <p className="label mb-3" style={{fontSize:"10px",color:"var(--primary)"}}>Process</p>
            <h2 className="font-display font-bold" style={{fontSize:"clamp(1.5rem,5vw,2.5rem)",color:"var(--text)"}}>Four steps to clarity</h2>
          </Reveal>
          <div className="space-y-3">
            {[
              {n:"01",t:"Upload",d:"Screenshot, .txt, or paste. Up to 3 files, 10MB."},
              {n:"02",t:"Analyze",d:"AI decodes emotional patterns, attachment styles, and hidden signals."},
              {n:"03",t:"Score",d:"Compatibility, ghosting risk, toxicity — all scored 0–100."},
              {n:"04",t:"Share",d:"Download your Gen Z card and share. Every share = growth."},
            ].map((s,i)=>(
              <Reveal key={s.n} delay={i*.07}>
                <div className="card p-4 flex items-center gap-4">
                  <div className="font-display text-xl font-bold flex-shrink-0" style={{color:"var(--primary)",minWidth:"36px"}}>{s.n}</div>
                  <div>
                    <p className="font-display font-bold text-sm mb-0.5" style={{color:"var(--text)"}}>{s.t}</p>
                    <p className="text-sm" style={{color:"var(--muted)"}}>{s.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-xl mx-auto text-center">
          <Reveal>
            <p className="label mb-3" style={{fontSize:"10px",color:"var(--primary)"}}>Voices</p>
            <h2 className="font-display font-bold mb-8" style={{fontSize:"clamp(1.4rem,5vw,2rem)",color:"var(--text)"}}>Real revelations</h2>
          </Reveal>
          <div className="relative" style={{minHeight:"160px"}}>
            <AnimatePresence mode="wait">
              {TESTIMONIALS.map((t,i)=>i===tIdx&&(
                <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.4}}
                  className="card p-6 sm:p-8 text-center">
                  <p className="text-base sm:text-lg leading-relaxed mb-4" style={{color:"var(--text)"}}>"{t.q}"</p>
                  <p className="font-display font-bold text-sm" style={{color:"var(--text)"}}>{t.n}</p>
                  <p className="label mt-0.5" style={{fontSize:"9px"}}>{t.c}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="flex justify-center gap-2 mt-4">
              {TESTIMONIALS.map((_,i)=>(
                <button key={i} onClick={()=>setTIdx(i)} aria-label={`Testimonial ${i+1}`}
                  style={{width:i===tIdx?24:8,height:8,borderRadius:4,background:i===tIdx?"var(--primary)":"var(--line-2)",transition:"all .25s ease",border:"none",cursor:"pointer",padding:0}}/>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <Reveal>
          <div className="max-w-lg mx-auto text-center card p-10 sm:p-14" style={{background:"var(--text)",borderColor:"var(--text)"}}>
            <p className="label mb-3" style={{fontSize:"10px",color:"rgba(255,255,255,.4)"}}>Start for free</p>
            <h2 className="font-display font-bold mb-3" style={{fontSize:"clamp(1.4rem,5vw,2rem)",color:"#fff"}}>Analyze yours, no cap.</h2>
            <p className="mb-6 text-sm" style={{color:"rgba(255,255,255,.5)"}}>Three free analyses. No credit card.</p>
            <Link href="/login" className="btn" style={{background:"#fff",color:"var(--text)",fontSize:"12px"}}>Analyse free →</Link>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6" style={{borderTop:"1px solid var(--line)"}}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" showTagline={false}/>
          <p className="label" style={{fontSize:"9px"}}>© 2026 AURAXA</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="label hover:text-primary transition-colors" style={{fontSize:"9px"}}>Privacy</Link>
            <Link href="/terms" className="label hover:text-primary transition-colors" style={{fontSize:"9px"}}>Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
