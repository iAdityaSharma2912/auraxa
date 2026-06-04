"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { toast } from "sonner";

type Tab = "chart" | "compatibility" | "palm";

// ─── Score bar ────────────────────────────────────────────
function ScoreBar({ label, score, delay = 0 }: { label: string; score: number; delay?: number }) {
  const c = score >= 70 ? "var(--green)" : score >= 50 ? "var(--amber)" : "var(--red)";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="label" style={{ fontSize: "9px" }}>{label}</span>
        <span className="font-display font-bold text-xs" style={{ color: c }}>{score}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-alt)" }}>
        <motion.div className="h-full rounded-full" style={{ background: c }}
          initial={{ width: 0 }} animate={{ width: `${score}%` }}
          transition={{ duration: 1.1, delay, ease: [.16,1,.3,1] }}/>
      </div>
    </div>
  );
}

// ─── Section block ────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="card overflow-hidden mb-4">
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom:"1px solid var(--line)", background:"var(--surface)" }}>
        <span style={{ fontSize:"16px" }}>{icon}</span>
        <h3 className="font-display font-bold text-sm" style={{ color:"var(--text)" }}>{title}</h3>
      </div>
      <div className="px-4 py-4">{children}</div>
    </motion.div>
  );
}

// ─── Tag pill ─────────────────────────────────────────────
function Tag({ text }: { text: string }) {
  return <span className="px-2.5 py-1 rounded text-xs font-display font-bold" style={{ background:"var(--pri-soft)", color:"var(--primary)", border:"1px solid var(--pri-border)" }}>{text}</span>;
}

// ─── Trait pill ───────────────────────────────────────────
function Trait({ text, type = "neutral" }: { text: string; type?: "good"|"bad"|"neutral" }) {
  const bg = type==="good"?"var(--green-soft)":type==="bad"?"var(--red-soft)":"var(--surface-alt)";
  const clr = type==="good"?"var(--green)":type==="bad"?"var(--red)":"var(--text)";
  return <span className="px-2.5 py-1.5 rounded text-xs leading-relaxed" style={{ background:bg, color:clr, border:`1px solid ${clr}20` }}>{text}</span>;
}

// ─── Birth chart report ───────────────────────────────────
function BirthChartReport({ data }: { data: any }) {
  const [showFull, setShowFull] = useState(false);
  return (
    <div>
      {/* Hero card */}
      <motion.div initial={{ opacity:0, scale:.97 }} animate={{ opacity:1, scale:1 }} transition={{ duration:.4 }}
        className="card p-5 mb-4" style={{ background:"linear-gradient(135deg,var(--pri-soft),var(--surface))", border:"1px solid var(--pri-border)" }}>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-3xl"
            style={{ background:"var(--primary)", boxShadow:"0 4px 20px rgba(108,85,224,.3)" }}>
            {data.symbol ?? "⭐"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="font-display font-bold text-xl" style={{ color:"var(--text)" }}>{data.sun_sign}</h2>
              <span className="label px-2 py-0.5 rounded" style={{ fontSize:"9px", background:"var(--primary)", color:"#fff" }}>{data.element} · {data.modality}</span>
            </div>
            <p className="text-xs mb-2" style={{ color:"var(--muted)" }}>Ruling planet: <span style={{ color:"var(--primary)" }}>{data.ruling_planet} {data.ruling_planet_symbol}</span></p>
            <p className="text-sm italic leading-relaxed" style={{ color:"var(--muted)" }}>"{data.tagline}"</p>
          </div>
        </div>

        {/* Core traits */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {(data.personality?.core_traits ?? []).map((t: string) => <Tag key={t} text={t}/>)}
        </div>
      </motion.div>

      {/* Personality */}
      <Section title="Personality Deep Dive" icon="🧬">
        <p className="text-sm leading-relaxed mb-4" style={{ color:"var(--muted)" }}>{data.personality?.overview}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="label mb-2" style={{ fontSize:"9px", color:"var(--green)" }}>STRENGTHS</p>
            <div className="space-y-1.5">
              {(data.personality?.strengths ?? []).map((s: string) => (
                <div key={s} className="flex gap-2 text-xs" style={{ color:"var(--muted)" }}>
                  <span style={{ color:"var(--green)", flexShrink:0 }}>✓</span>{s}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="label mb-2" style={{ fontSize:"9px", color:"var(--red)" }}>CHALLENGES</p>
            <div className="space-y-1.5">
              {(data.personality?.challenges ?? []).map((c: string) => (
                <div key={c} className="flex gap-2 text-xs" style={{ color:"var(--muted)" }}>
                  <span style={{ color:"var(--red)", flexShrink:0 }}>⚠</span>{c}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-3 rounded mb-3" style={{ background:"var(--surface-alt)" }}>
          <p className="label mb-1" style={{ fontSize:"9px" }}>Shadow Side</p>
          <p className="text-xs leading-relaxed" style={{ color:"var(--muted)" }}>{data.personality?.shadow_side}</p>
        </div>
        <div className="p-3 rounded" style={{ background:"var(--pri-soft)", border:"1px solid var(--pri-border)" }}>
          <p className="label mb-1" style={{ fontSize:"9px", color:"var(--primary)" }}>Hidden Depth</p>
          <p className="text-xs leading-relaxed" style={{ color:"var(--muted)" }}>{data.personality?.hidden_depth}</p>
        </div>
      </Section>

      {/* Love */}
      <Section title="Love & Relationships" icon="💜">
        <p className="text-sm leading-relaxed mb-4" style={{ color:"var(--muted)" }}>{data.love_and_relationships?.overview}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded" style={{ background:"var(--surface-alt)" }}>
            <p className="label mb-1.5" style={{ fontSize:"9px" }}>Love Language</p>
            <p className="text-xs leading-relaxed" style={{ color:"var(--text)" }}>{data.love_and_relationships?.love_language}</p>
          </div>
          <div className="p-3 rounded" style={{ background:"var(--surface-alt)" }}>
            <p className="label mb-1.5" style={{ fontSize:"9px" }}>Ideal Partner</p>
            <p className="text-xs leading-relaxed" style={{ color:"var(--text)" }}>{data.love_and_relationships?.ideal_partner}</p>
          </div>
        </div>
        <div className="mb-4">
          <p className="label mb-2" style={{ fontSize:"9px", color:"var(--green)" }}>BEST MATCHES</p>
          <div className="flex flex-wrap gap-2">
            {(data.love_and_relationships?.best_matches ?? []).map((m: string) => <Trait key={m} text={m} type="good"/>)}
          </div>
        </div>
        <div className="mb-4">
          <p className="label mb-2" style={{ fontSize:"9px", color:"var(--amber)" }}>DEALBREAKERS</p>
          <div className="flex flex-wrap gap-2">
            {(data.love_and_relationships?.dealbreakers ?? []).map((d: string) => <Trait key={d} text={d} type="bad"/>)}
          </div>
        </div>
        <div className="p-3 rounded" style={{ background:"var(--pri-soft)", border:"1px solid var(--pri-border)" }}>
          <p className="label mb-1" style={{ fontSize:"9px", color:"var(--primary)" }}>What You Need to Hear</p>
          <p className="text-sm italic" style={{ color:"var(--text)" }}>"{data.love_and_relationships?.what_they_need_to_hear}"</p>
        </div>
      </Section>

      {/* Career */}
      <Section title="Career & Life Purpose" icon="🎯">
        <p className="text-sm leading-relaxed mb-4" style={{ color:"var(--muted)" }}>{data.career_and_purpose?.overview}</p>
        <div className="mb-4">
          <p className="label mb-2" style={{ fontSize:"9px" }}>IDEAL CAREERS</p>
          <div className="flex flex-wrap gap-2">
            {(data.career_and_purpose?.ideal_careers ?? []).map((c: string) => <Tag key={c} text={c}/>)}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded" style={{ background:"var(--surface-alt)" }}>
            <p className="label mb-1" style={{ fontSize:"9px" }}>Work Style</p>
            <p className="text-xs" style={{ color:"var(--text)" }}>{data.career_and_purpose?.work_style}</p>
          </div>
          <div className="p-3 rounded" style={{ background:"var(--surface-alt)" }}>
            <p className="label mb-1" style={{ fontSize:"9px" }}>Money & Finance</p>
            <p className="text-xs" style={{ color:"var(--text)" }}>{data.career_and_purpose?.financial_tendency}</p>
          </div>
        </div>
        <div className="p-3 rounded" style={{ background:"var(--pri-soft)", border:"1px solid var(--pri-border)" }}>
          <p className="label mb-1" style={{ fontSize:"9px", color:"var(--primary)" }}>Soul Purpose</p>
          <p className="text-sm italic" style={{ color:"var(--muted)" }}>{data.career_and_purpose?.life_purpose}</p>
        </div>
      </Section>

      {/* Spiritual */}
      <Section title="Cosmic & Spiritual" icon="✨">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {[
            { l:"Element", v:data.spiritual_and_cosmic?.element_deep_dive },
            { l:"Karmic Pattern", v:data.spiritual_and_cosmic?.karmic_pattern },
            { l:"Manifestation Style", v:data.spiritual_and_cosmic?.manifestation_style },
            { l:"Power Days", v:data.spiritual_and_cosmic?.power_days },
          ].map(i => i.v && (
            <div key={i.l} className="p-3 rounded" style={{ background:"var(--surface-alt)" }}>
              <p className="label mb-1" style={{ fontSize:"9px" }}>{i.l.toUpperCase()}</p>
              <p className="text-xs leading-relaxed" style={{ color:"var(--text)" }}>{i.v}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {(data.spiritual_and_cosmic?.crystals ?? []).map((c: string) => (
            <span key={c} className="px-2.5 py-1 rounded text-xs" style={{ background:"var(--surface-alt)", color:"var(--primary)", border:"1px solid var(--pri-border)" }}>💎 {c}</span>
          ))}
        </div>
        {data.spiritual_and_cosmic?.mantra && (
          <div className="p-4 rounded text-center" style={{ background:"var(--pri-soft)", border:"1px solid var(--pri-border)" }}>
            <p className="label mb-1" style={{ fontSize:"9px", color:"var(--primary)" }}>YOUR MANTRA</p>
            <p className="font-display font-bold text-base italic" style={{ color:"var(--text)" }}>"{data.spiritual_and_cosmic.mantra}"</p>
          </div>
        )}
      </Section>

      {/* 2026 Forecast */}
      <Section title="2026 Forecast" icon="🔮">
        <p className="text-sm leading-relaxed mb-4" style={{ color:"var(--muted)" }}>{data.current_forecast?.year_2026}</p>
        <div className="grid grid-cols-1 gap-2 mb-4">
          <p className="label" style={{ fontSize:"9px" }}>KEY THEMES</p>
          <div className="flex flex-wrap gap-2">
            {(data.current_forecast?.key_themes ?? []).map((t: string) => <Tag key={t} text={t}/>)}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded" style={{ background:"var(--green-soft)", border:"1px solid rgba(4,120,87,.2)" }}>
            <p className="label mb-1" style={{ fontSize:"9px", color:"var(--green)" }}>BIGGEST OPPORTUNITY</p>
            <p className="text-xs" style={{ color:"var(--text)" }}>{data.current_forecast?.opportunity}</p>
          </div>
          <div className="p-3 rounded" style={{ background:"var(--red-soft)", border:"1px solid rgba(204,0,0,.15)" }}>
            <p className="label mb-1" style={{ fontSize:"9px", color:"var(--red)" }}>WATCH OUT FOR</p>
            <p className="text-xs" style={{ color:"var(--text)" }}>{data.current_forecast?.watch_out_for}</p>
          </div>
        </div>
      </Section>

      {/* Famous examples */}
      {(data.famous_examples ?? []).length > 0 && (
        <Section title="Famous Examples" icon="⭐">
          <div className="flex flex-wrap gap-2">
            {data.famous_examples.map((f: string) => (
              <span key={f} className="px-3 py-1.5 rounded text-xs font-display font-bold" style={{ background:"var(--surface-alt)", color:"var(--text)" }}>⭐ {f}</span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Compatibility report ─────────────────────────────────
function CompatibilityReport({ data }: { data: any }) {
  const scoreColor = data.compatibility_score >= 70 ? "var(--green)" : data.compatibility_score >= 50 ? "var(--amber)" : "var(--red)";
  return (
    <div>
      {/* Hero */}
      <motion.div initial={{ opacity:0, scale:.97 }} animate={{ opacity:1, scale:1 }} className="card p-5 mb-4 text-center"
        style={{ background:"linear-gradient(135deg,var(--pri-soft),var(--surface))", border:"1px solid var(--pri-border)" }}>
        <p className="font-display font-bold text-xl mb-1" style={{ color:"var(--text)" }}>
          {data.person_a?.name} × {data.person_b?.name}
        </p>
        <p className="font-display font-bold" style={{ fontSize:"4rem", lineHeight:1, color:scoreColor }}>{data.compatibility_score}</p>
        <p className="label mt-1 mb-2" style={{ fontSize:"9px" }}>{data.compatibility_label}</p>
        <p className="text-sm italic" style={{ color:"var(--muted)" }}>"{data.tagline}"</p>
      </motion.div>

      <Section title="Overall Dynamic" icon="💫">
        <p className="text-sm leading-relaxed" style={{ color:"var(--muted)" }}>{data.overview}</p>
      </Section>

      {/* Synastry scores */}
      <Section title="Compatibility Breakdown" icon="📊">
        <div className="space-y-4">
          {Object.entries(data.synastry ?? {}).map(([key, val]: [string, any], i) => (
            <div key={key}>
              <ScoreBar label={key.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())} score={val.score} delay={i*.1}/>
              <p className="text-xs mt-1 leading-relaxed" style={{ color:"var(--muted)" }}>{val.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Strengths & Challenges */}
      <Section title="Strengths & Challenges" icon="⚖️">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="label mb-2" style={{ fontSize:"9px", color:"var(--green)" }}>STRENGTHS</p>
            <div className="space-y-1.5">
              {(data.strengths ?? []).map((s: string) => (
                <div key={s} className="flex gap-2 text-xs" style={{ color:"var(--muted)" }}><span style={{ color:"var(--green)" }}>✓</span>{s}</div>
              ))}
            </div>
          </div>
          <div>
            <p className="label mb-2" style={{ fontSize:"9px", color:"var(--red)" }}>CHALLENGES</p>
            <div className="space-y-1.5">
              {(data.challenges ?? []).map((c: string) => (
                <div key={c} className="flex gap-2 text-xs" style={{ color:"var(--muted)" }}><span style={{ color:"var(--red)" }}>⚠</span>{c}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { l:"Who Leads", v:data.dynamic?.who_leads },
            { l:"Who Nurtures", v:data.dynamic?.who_nurtures },
            { l:"Tension Point", v:data.dynamic?.tension_point },
            { l:"Growth Opportunity", v:data.dynamic?.growth_opportunity },
          ].map(i => i.v && (
            <div key={i.l} className="p-3 rounded" style={{ background:"var(--surface-alt)" }}>
              <p className="label mb-1" style={{ fontSize:"9px" }}>{i.l.toUpperCase()}</p>
              <p className="text-xs" style={{ color:"var(--text)" }}>{i.v}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Love advice */}
      <Section title="Relationship Advice" icon="💌">
        <div className="space-y-3">
          {[
            { label:`For ${data.person_a?.name}`, value:data.love_advice?.for_person_a, clr:"var(--primary)" },
            { label:`For ${data.person_b?.name}`, value:data.love_advice?.for_person_b, clr:"var(--green)" },
            { label:"Together", value:data.love_advice?.together, clr:"var(--amber)" },
          ].map(a => a.value && (
            <div key={a.label} className="p-3 rounded" style={{ background:"var(--surface-alt)", borderLeft:`3px solid ${a.clr}` }}>
              <p className="label mb-1" style={{ fontSize:"9px", color:a.clr }}>{a.label.toUpperCase()}</p>
              <p className="text-xs leading-relaxed" style={{ color:"var(--text)" }}>{a.value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Verdict */}
      <div className="card p-5 text-center mb-4" style={{ background:"var(--pri-soft)", border:"1px solid var(--pri-border)" }}>
        <p className="label mb-2" style={{ fontSize:"9px", color:"var(--primary)" }}>THE VERDICT</p>
        <p className="text-base italic" style={{ color:"var(--text)" }}>"{data.verdict}"</p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────
export default function AstrologyPage() {
  const [tab, setTab]           = useState<Tab>("chart");
  const [loading, setLoading]   = useState(false);
  const [chartResult, setChartResult] = useState<any>(null);
  const [compatResult, setCompatResult] = useState<any>(null);
  const [palmResult, setPalmResult]   = useState<any>(null);

  // Chart form
  const [name, setName]         = useState("");
  const [dob, setDob]           = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthplace, setBirthplace] = useState("");

  // Compat form
  const [aName, setAName] = useState(""); const [aDob, setADob] = useState("");
  const [bName, setBName] = useState(""); const [bDob, setBDob] = useState("");

  // Palm
  const [palmFile, setPalmFile] = useState<File|null>(null);
  const [palmRef, setPalmRef]   = useState<HTMLInputElement|null>(null);

  const Spinner = () => <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>;

  const runChart = async () => {
    if (!dob) { toast.error("Enter your date of birth."); return; }
    setLoading(true); setChartResult(null);
    try {
      const r = await api.post("/api/astrology/chart", { dob, name:name||"You", birth_time:birthTime||null, birthplace:birthplace||null });
      setChartResult(r.data);
    } catch(e:any) { toast.error(e?.response?.data?.detail || "Chart generation failed."); }
    finally { setLoading(false); }
  };

  const runCompat = async () => {
    if (!aDob || !bDob) { toast.error("Enter both dates of birth."); return; }
    setLoading(true); setCompatResult(null);
    try {
      const r = await api.post("/api/astrology/compatibility", {
        person_a_dob:aDob, person_a_name:aName||"You",
        person_b_dob:bDob, person_b_name:bName||"Them",
      });
      setCompatResult(r.data);
    } catch(e:any) { toast.error(e?.response?.data?.detail || "Compatibility reading failed."); }
    finally { setLoading(false); }
  };

  const runPalm = async () => {
    if (!palmFile) { toast.error("Upload a palm photo."); return; }
    setLoading(true); setPalmResult(null);
    try {
      const fd = new FormData(); fd.append("file", palmFile);
      const r = await api.post("/api/palm/analyse", fd, { headers:{"Content-Type":"multipart/form-data"} });
      setPalmResult(r.data);
    } catch(e:any) { toast.error(e?.response?.data?.detail || "Palm reading failed."); }
    finally { setLoading(false); }
  };

  return (
    <div className="px-3 sm:px-5 md:px-8 py-4 md:py-8 max-w-2xl">

      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="mb-6">
        <p className="label mb-2" style={{ fontSize:"9px", color:"var(--primary)" }}>Cosmic Intelligence</p>
        <h1 className="font-display font-bold mb-1" style={{ fontSize:"clamp(1.3rem,5vw,1.875rem)", color:"var(--text)" }}>Astrology & Palmistry</h1>
        <p className="text-sm" style={{ color:"var(--muted)" }}>Deep astrological insights, compatibility readings, and AI palm analysis.</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded mb-6" style={{ background:"var(--surface-alt)" }}>
        {([["chart","Birth Chart"],["compatibility","Compatibility"],["palm","Palm Reading"]] as const).map(([id,label]) => (
          <button key={id} onClick={()=>setTab(id)} className="flex-1 py-2.5 rounded font-display font-bold transition-all"
            style={{ fontSize:"clamp(10px,2.5vw,13px)", ...(id===tab?{background:"var(--bg)",color:"var(--text)",boxShadow:"var(--shadow-sm)"}:{color:"var(--muted)"}) }}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── BIRTH CHART ── */}
        {tab==="chart" && (
          <motion.div key="chart" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <div className="card p-4 mb-4">
              <p className="label mb-4" style={{ fontSize:"9px" }}>Enter Your Details</p>
              <div className="space-y-3">
                <div><label className="label mb-1.5 block" style={{ fontSize:"9px" }}>Your Name</label>
                  <input className="input" placeholder="Aditya Sharma" value={name} onChange={e=>setName(e.target.value)}/></div>
                <div><label className="label mb-1.5 block" style={{ fontSize:"9px" }}>Date of Birth <span style={{ color:"var(--red)" }}>*</span></label>
                  <input type="date" title="Date of birth" className="input" value={dob} onChange={e=>setDob(e.target.value)}/></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label mb-1.5 block" style={{ fontSize:"9px" }}>Birth Time <span style={{ color:"var(--muted)" }}>(optional)</span></label>
                    <input type="time" title="Birth time" className="input" value={birthTime} onChange={e=>setBirthTime(e.target.value)}/></div>
                  <div><label className="label mb-1.5 block" style={{ fontSize:"9px" }}>Birthplace <span style={{ color:"var(--muted)" }}>(optional)</span></label>
                    <input className="input" placeholder="Delhi, India" value={birthplace} onChange={e=>setBirthplace(e.target.value)}/></div>
                </div>
              </div>
              <button onClick={runChart} disabled={loading} className="btn btn-primary w-full mt-4">
                {loading ? <><Spinner/><span className="ml-2">Reading your chart...</span></> : "Generate Full Report →"}
              </button>
            </div>
            {chartResult && <BirthChartReport data={chartResult}/>}
          </motion.div>
        )}

        {/* ── COMPATIBILITY ── */}
        {tab==="compatibility" && (
          <motion.div key="compat" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <div className="card p-4 mb-4">
              <p className="label mb-4" style={{ fontSize:"9px" }}>Enter Both People's Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="label" style={{ fontSize:"9px", color:"var(--primary)" }}>PERSON A</p>
                  <input className="input" placeholder="Your name" value={aName} onChange={e=>setAName(e.target.value)}/>
                  <input type="date" title="Person A DOB" className="input" value={aDob} onChange={e=>setADob(e.target.value)}/>
                </div>
                <div className="space-y-3">
                  <p className="label" style={{ fontSize:"9px", color:"var(--green)" }}>PERSON B</p>
                  <input className="input" placeholder="Their name" value={bName} onChange={e=>setBName(e.target.value)}/>
                  <input type="date" title="Person B DOB" className="input" value={bDob} onChange={e=>setBDob(e.target.value)}/>
                </div>
              </div>
              <button onClick={runCompat} disabled={loading} className="btn btn-primary w-full mt-4">
                {loading ? <><Spinner/><span className="ml-2">Analysing compatibility...</span></> : "Read Compatibility →"}
              </button>
            </div>
            {compatResult && <CompatibilityReport data={compatResult}/>}
          </motion.div>
        )}

        {/* ── PALM ── */}
        {tab==="palm" && (
          <motion.div key="palm" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <div className="card p-4 mb-4">
              <p className="label mb-3" style={{ fontSize:"9px" }}>Upload Your Palm Photo</p>
              <p className="text-xs mb-4 leading-relaxed" style={{ color:"var(--muted)" }}>
                Take a clear photo of your dominant hand's palm in good lighting. Fingers together, palm flat facing the camera.
              </p>
              <input ref={r=>setPalmRef(r)} type="file" accept="image/*" className="hidden" onChange={e=>setPalmFile(e.target.files?.[0]??null)}/>
              <button onClick={()=>palmRef?.click()} className="w-full py-10 rounded flex flex-col items-center justify-center gap-3 mb-3"
                style={{ border:"2px dashed var(--line-2)", background:"var(--surface)", cursor:"pointer" }}>
                <span style={{ fontSize:"2.5rem" }}>✋</span>
                {palmFile ? <p className="font-display font-bold text-sm" style={{ color:"var(--text)" }}>{palmFile.name}</p>
                  : <><p className="font-display font-bold text-sm" style={{ color:"var(--text)" }}>Tap to upload palm photo</p>
                     <p className="label" style={{ fontSize:"9px" }}>JPG, PNG, WEBP · Max 5MB</p></>}
              </button>
              <button onClick={runPalm} disabled={loading||!palmFile} className="btn btn-primary w-full">
                {loading ? <><Spinner/><span className="ml-2">Reading your palm...</span></> : "Read My Palm →"}
              </button>
            </div>

            {palmResult && (
              <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
                {["heart_line","head_line","life_line","fate_line","sun_line"].map(line => palmResult[line] && (
                  <Section key={line} title={line.replace("_"," ").replace(/\b\w/g,c=>c.toUpperCase())} icon="✋">
                    <p className="text-sm leading-relaxed" style={{ color:"var(--muted)" }}>{palmResult[line]}</p>
                  </Section>
                ))}
                {palmResult.overall_reading && (
                  <Section title="Overall Reading" icon="🔮">
                    <p className="text-sm leading-relaxed" style={{ color:"var(--muted)" }}>{palmResult.overall_reading}</p>
                  </Section>
                )}
                {palmResult.guidance && (
                  <div className="card p-5 text-center" style={{ background:"var(--pri-soft)", border:"1px solid var(--pri-border)" }}>
                    <p className="label mb-2" style={{ fontSize:"9px", color:"var(--primary)" }}>COSMIC GUIDANCE</p>
                    <p className="text-sm italic" style={{ color:"var(--text)" }}>"{palmResult.guidance}"</p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
