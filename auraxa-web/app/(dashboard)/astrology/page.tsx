"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { toast } from "sonner";

type Tab = "chart" | "compatibility" | "palm";

export default function AstrologyPage() {
  const [tab, setTab] = useState<Tab>("chart");

  // Chart
  const [dob, setDob] = useState("");
  const [name, setName] = useState("");
  const [chartResult, setChartResult] = useState<any>(null);

  // Compatibility
  const [aName, setAName] = useState(""); const [aDob, setADob] = useState("");
  const [bName, setBName] = useState(""); const [bDob, setBDob] = useState("");
  const [compatResult, setCompatResult] = useState<any>(null);

  // Palm
  const [palmFile, setPalmFile] = useState<File | null>(null);
  const [palmResult, setPalmResult] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  const runChart = async () => {
    if (!dob) { toast.error("Enter your date of birth."); return; }
    setLoading(true); setChartResult(null);
    try {
      const res = await api.post("/api/astrology/chart", { dob, name: name || "You" });
      setChartResult(res.data);
    } catch (err: any) { toast.error(err?.response?.data?.detail || "Analysis failed."); }
    finally { setLoading(false); }
  };

  const runCompat = async () => {
    if (!aDob || !bDob) { toast.error("Enter both dates of birth."); return; }
    setLoading(true); setCompatResult(null);
    try {
      const res = await api.post("/api/astrology/compatibility", {
        person_a_dob: aDob, person_a_name: aName || "You",
        person_b_dob: bDob, person_b_name: bName || "Them",
      });
      setCompatResult(res.data);
    } catch (err: any) { toast.error(err?.response?.data?.detail || "Analysis failed."); }
    finally { setLoading(false); }
  };

  const runPalm = async () => {
    if (!palmFile) { toast.error("Upload a palm photo."); return; }
    setLoading(true); setPalmResult(null);
    try {
      const fd = new FormData();
      fd.append("file", palmFile);
      const res = await api.post("/api/palm/analyse", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setPalmResult(res.data);
    } catch (err: any) { toast.error(err?.response?.data?.detail || "Analysis failed."); }
    finally { setLoading(false); }
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "chart", label: "Birth Chart" },
    { id: "compatibility", label: "Compatibility" },
    { id: "palm", label: "Palm Reading" },
  ];

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <p className="label mb-2" style={{ color: "#3457d5" }}>Cosmic Intelligence</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold" style={{ color: "#171a20" }}>Astrology & Palmistry</h1>
        <p className="mt-2" style={{ color: "#5c5e62" }}>Birth charts, compatibility readings, and AI palm analysis.</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded mb-6" style={{ background: "var(--surface-alt)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 rounded text-sm font-display font-semibold transition-all"
            style={t.id === tab ? { background: "#fff", color: "#171a20", boxShadow: "var(--shadow-sm)" } : { color: "#5c5e62" }}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* BIRTH CHART */}
        {tab === "chart" && (
          <motion.div key="chart" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            <div className="card p-6 mb-4 space-y-4">
              <div>
                <label className="label mb-2 block">Your Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <label className="label mb-2 block">Date of Birth</label>
                <input type="date" title="Date of birth" className="input" value={dob} onChange={e => setDob(e.target.value)} />
              </div>
              <button onClick={runChart} disabled={loading} className="btn btn-primary w-full">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Read My Chart →"}
              </button>
            </div>
            {chartResult && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-4">
                {chartResult.sun_sign && (
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded flex items-center justify-center text-2xl" style={{ background: "var(--surface-alt)", color: "#3457d5" }}>
                      {chartResult.symbol ?? "☉"}
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold" style={{ color: "#171a20" }}>{chartResult.sun_sign}</p>
                      <p className="label">{chartResult.element ?? ""} {chartResult.modality ?? ""}</p>
                    </div>
                  </div>
                )}
                {chartResult.reading && <p className="text-sm leading-relaxed" style={{ color: "#5c5e62" }}>{chartResult.reading}</p>}
                {chartResult.traits && (
                  <div className="flex flex-wrap gap-2">
                    {chartResult.traits.map((t: string) => (
                      <span key={t} className="px-2.5 py-1 rounded text-xs" style={{ background: "var(--surface-alt)", color: "#171a20" }}>{t}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* COMPATIBILITY */}
        {tab === "compatibility" && (
          <motion.div key="compat" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            <div className="card p-6 mb-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-2 block">Person A</label>
                  <input className="input mb-2" placeholder="Name" value={aName} onChange={e => setAName(e.target.value)} />
                  <input type="date" title="Person A DOB" className="input" value={aDob} onChange={e => setADob(e.target.value)} />
                </div>
                <div>
                  <label className="label mb-2 block">Person B</label>
                  <input className="input mb-2" placeholder="Name" value={bName} onChange={e => setBName(e.target.value)} />
                  <input type="date" title="Person B DOB" className="input" value={bDob} onChange={e => setBDob(e.target.value)} />
                </div>
              </div>
              <button onClick={runCompat} disabled={loading} className="btn btn-primary w-full">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Analyse Compatibility →"}
              </button>
            </div>
            {compatResult && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6 text-center space-y-4">
                <div>
                  <p className="font-display text-4xl font-bold" style={{ color: "#3457d5" }}>{compatResult.compatibility_score ?? compatResult.score}%</p>
                  <p className="label mt-1">Cosmic Compatibility</p>
                </div>
                {compatResult.summary && <p className="text-sm leading-relaxed text-left" style={{ color: "#5c5e62" }}>{compatResult.summary}</p>}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* PALM */}
        {tab === "palm" && (
          <motion.div key="palm" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            <div className="card p-6 mb-4">
              <input id="palm-up" type="file" accept="image/*" className="hidden" onChange={e => setPalmFile(e.target.files?.[0] ?? null)} />
              <label htmlFor="palm-up" className="block w-full py-10 rounded text-center cursor-pointer" style={{ border: "2px dashed var(--line)" }}>
                <span className="text-3xl block mb-2" style={{ color: "#3457d5" }}>✋</span>
                {palmFile ? (
                  <p className="font-display font-semibold text-sm" style={{ color: "#171a20" }}>{palmFile.name}</p>
                ) : (
                  <>
                    <p className="font-display font-semibold text-sm" style={{ color: "#171a20" }}>Upload palm photo</p>
                    <p className="label mt-1">Clear photo of your dominant hand</p>
                  </>
                )}
              </label>
              <button onClick={runPalm} disabled={loading || !palmFile} className="btn btn-primary w-full mt-4">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Read My Palm →"}
              </button>
            </div>
            {palmResult && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {["heart_line", "head_line", "life_line"].map(line => palmResult[line] && (
                  <div key={line} className="card p-5">
                    <p className="label mb-2" style={{ color: "#3457d5" }}>{line.replace("_", " ")}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#5c5e62" }}>{palmResult[line]}</p>
                  </div>
                ))}
                {palmResult.guidance && (
                  <div className="card p-5" style={{ background: "var(--surface-alt)" }}>
                    <p className="label mb-2">Guidance</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#171a20" }}>{palmResult.guidance}</p>
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
