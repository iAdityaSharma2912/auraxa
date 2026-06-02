"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { toast } from "sonner";

type Tab = "chart" | "compatibility" | "palm";

export default function AstrologyPage() {
  const [tab, setTab] = useState<Tab>("chart");
  const [loading, setLoading] = useState(false);
  const [dob, setDob] = useState(""); const [name, setName] = useState(""); const [chartRes, setChartRes] = useState<any>(null);
  const [aDob, setADob] = useState(""); const [aName, setAName] = useState(""); const [bDob, setBDob] = useState(""); const [bName, setBName] = useState(""); const [compatRes, setCompatRes] = useState<any>(null);
  const [palmFile, setPalmFile] = useState<File|null>(null); const [palmRes, setPalmRes] = useState<any>(null);

  const Spinner = () => <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>;

  const runChart = async () => {
    if (!dob) { toast.error("Enter your date of birth."); return; }
    setLoading(true); setChartRes(null);
    try { const r=await api.post("/api/astrology/chart",{dob,name:name||"You"}); setChartRes(r.data); }
    catch(e:any) { toast.error(e?.response?.data?.detail||"Analysis failed."); }
    finally { setLoading(false); }
  };

  const runCompat = async () => {
    if (!aDob||!bDob) { toast.error("Enter both dates."); return; }
    setLoading(true); setCompatRes(null);
    try { const r=await api.post("/api/astrology/compatibility",{person_a_dob:aDob,person_a_name:aName||"You",person_b_dob:bDob,person_b_name:bName||"Them"}); setCompatRes(r.data); }
    catch(e:any) { toast.error(e?.response?.data?.detail||"Failed."); }
    finally { setLoading(false); }
  };

  const runPalm = async () => {
    if (!palmFile) { toast.error("Upload a palm photo."); return; }
    setLoading(true); setPalmRes(null);
    try { const fd=new FormData(); fd.append("file",palmFile); const r=await api.post("/api/palm/analyse",fd,{headers:{"Content-Type":"multipart/form-data"}}); setPalmRes(r.data); }
    catch(e:any) { toast.error(e?.response?.data?.detail||"Failed."); }
    finally { setLoading(false); }
  };

  return (
    <div className="px-3 sm:px-5 md:px-8 py-4 md:py-8 max-w-2xl">
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="mb-5 md:mb-8">
        <p className="label mb-2" style={{ fontSize:"9px", color:"var(--primary)" }}>Cosmic Intelligence</p>
        <h1 className="font-display font-bold" style={{ fontSize:"clamp(1.3rem,5vw,1.875rem)", color:"var(--text)" }}>Astrology & Palmistry</h1>
        <p className="text-sm mt-1" style={{ color:"var(--muted)" }}>Birth charts, compatibility, and AI palm analysis.</p>
      </motion.div>

      {/* Tabs — scrollable on small screens */}
      <div className="flex gap-1 p-1 rounded mb-5" style={{ background:"var(--surface-alt)" }}>
        {([{id:"chart",l:"Birth Chart"},{id:"compatibility",l:"Compatibility"},{id:"palm",l:"Palm Reading"}] as const).map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id as Tab)} className="flex-1 py-2.5 rounded font-display font-bold transition-all"
            style={{ fontSize:"clamp(10px,2.5vw,13px)", ...(t.id===tab?{background:"var(--bg)",color:"var(--text)",boxShadow:"var(--shadow-sm)"}:{color:"var(--muted)"}) }}>
            {t.l}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab==="chart"&&(
          <motion.div key="chart" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <div className="card p-4 mb-4 space-y-3">
              <div><label className="label mb-1.5 block" style={{ fontSize:"9px" }}>Your Name</label>
                <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></div>
              <div><label className="label mb-1.5 block" style={{ fontSize:"9px" }}>Date of Birth</label>
                <input type="date" title="Date of birth" className="input" value={dob} onChange={e=>setDob(e.target.value)}/></div>
              <button onClick={runChart} disabled={loading} className="btn btn-primary w-full">{loading?<Spinner/>:"Read My Chart →"}</button>
            </div>
            {chartRes&&<motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="card p-4 space-y-3">
              {chartRes.sun_sign&&<div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded flex items-center justify-center text-xl" style={{ background:"var(--surface-alt)", color:"var(--primary)" }}>{chartRes.symbol??"☉"}</div>
                <div><p className="font-display text-base font-bold" style={{ color:"var(--text)" }}>{chartRes.sun_sign}</p><p className="label" style={{ fontSize:"9px" }}>{chartRes.element??""} {chartRes.modality??""}</p></div>
              </div>}
              {chartRes.reading&&<p className="text-sm leading-relaxed" style={{ color:"var(--muted)" }}>{chartRes.reading}</p>}
              {chartRes.traits&&<div className="flex flex-wrap gap-2">{chartRes.traits.map((t:string)=>(
                <span key={t} className="px-2.5 py-1 rounded text-xs" style={{ background:"var(--surface-alt)", color:"var(--text)" }}>{t}</span>
              ))}</div>}
            </motion.div>}
          </motion.div>
        )}

        {tab==="compatibility"&&(
          <motion.div key="compat" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <div className="card p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label mb-1.5 block" style={{ fontSize:"9px" }}>Person A</label>
                  <input className="input mb-2" placeholder="Name" value={aName} onChange={e=>setAName(e.target.value)}/>
                  <input type="date" title="Person A DOB" className="input" value={aDob} onChange={e=>setADob(e.target.value)}/></div>
                <div><label className="label mb-1.5 block" style={{ fontSize:"9px" }}>Person B</label>
                  <input className="input mb-2" placeholder="Name" value={bName} onChange={e=>setBName(e.target.value)}/>
                  <input type="date" title="Person B DOB" className="input" value={bDob} onChange={e=>setBDob(e.target.value)}/></div>
              </div>
              <button onClick={runCompat} disabled={loading} className="btn btn-primary w-full">{loading?<Spinner/>:"Analyse Compatibility →"}</button>
            </div>
            {compatRes&&<motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="card p-4 text-center space-y-3">
              <p className="font-display text-4xl font-bold" style={{ color:"var(--primary)" }}>{compatRes.compatibility_score??compatRes.score}%</p>
              <p className="label" style={{ fontSize:"9px" }}>Cosmic Compatibility</p>
              {compatRes.summary&&<p className="text-sm leading-relaxed text-left" style={{ color:"var(--muted)" }}>{compatRes.summary}</p>}
            </motion.div>}
          </motion.div>
        )}

        {tab==="palm"&&(
          <motion.div key="palm" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <div className="card p-4 mb-4">
              <input id="palm-up" type="file" accept="image/*" className="hidden" onChange={e=>setPalmFile(e.target.files?.[0]??null)}/>
              <label htmlFor="palm-up" className="block w-full py-10 rounded text-center cursor-pointer" style={{ border:"2px dashed var(--line-2)" }}>
                <span className="text-3xl block mb-2" style={{ color:"var(--primary)" }}>✋</span>
                {palmFile?<p className="font-display font-bold text-sm" style={{ color:"var(--text)" }}>{palmFile.name}</p>
                  :<><p className="font-display font-bold text-sm" style={{ color:"var(--text)" }}>Tap to upload palm photo</p><p className="label mt-1" style={{ fontSize:"9px" }}>Clear photo of your dominant hand</p></>}
              </label>
              <button onClick={runPalm} disabled={loading||!palmFile} className="btn btn-primary w-full mt-3">{loading?<Spinner/>:"Read My Palm →"}</button>
            </div>
            {palmRes&&<motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="space-y-3">
              {["heart_line","head_line","life_line"].map(l=>palmRes[l]&&(
                <div key={l} className="card p-4">
                  <p className="label mb-1.5" style={{ fontSize:"9px", color:"var(--primary)" }}>{l.replace("_"," ")}</p>
                  <p className="text-sm leading-relaxed" style={{ color:"var(--muted)" }}>{palmRes[l]}</p>
                </div>
              ))}
              {palmRes.guidance&&<div className="card p-4" style={{ background:"var(--surface-alt)" }}>
                <p className="label mb-1.5" style={{ fontSize:"9px" }}>Guidance</p>
                <p className="text-sm leading-relaxed" style={{ color:"var(--text)" }}>{palmRes.guidance}</p>
              </div>}
            </motion.div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
