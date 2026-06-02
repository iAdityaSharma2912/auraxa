"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";

type Tab = "paste" | "upload";

export default function AnalyzePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("paste");
  const [text, setText] = useState("");
  const [speakerA, setSpeakerA] = useState("");
  const [speakerB, setSpeakerB] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePasteSubmit = async () => {
  if (text.trim().length < 20) { toast.error("Please paste a longer conversation."); return; }
  setLoading(true);
  try {
    const res = await api.post("/api/analyze/paste", {
      text: text,
      intent: "conversation",
    });
    const id = res.data?.analysis_id ?? res.data?.id;      toast.success("Analysis started!");
      router.push(`/results/${id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Analysis failed.");
    } finally { setLoading(false); }
  };

  const handleFileSubmit = async () => {
  if (!file) { toast.error("Please select a file."); return; }
  setLoading(true);
  try {
    const fd = new FormData();
    fd.append("files", file);
    fd.append("intent", "conversation");
    const res = await api.post("/api/analyze/upload", fd);
    const id = res.data?.analysis_id ?? res.data?.id;      toast.success("Analysis started!");
      router.push(`/results/${id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Upload failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <p className="label mb-2" style={{ color: "#3457d5" }}>New Reading</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold" style={{ color: "#171a20" }}>Analyse a Conversation</h1>
        <p className="mt-2" style={{ color: "#5c5e62" }}>Paste a chat or upload a screenshot. We'll decode the emotional intelligence within.</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded mb-6 max-w-xs" style={{ background: "var(--surface-alt)" }}>
        {(["paste", "upload"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded text-sm font-display font-semibold transition-all"
            style={t === tab ? { background: "#fff", color: "#171a20", boxShadow: "var(--shadow-sm)" } : { color: "#5c5e62" }}>
            {t === "paste" ? "Paste Text" : "Upload File"}
          </button>
        ))}
      </div>

      {/* Speaker names */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="label mb-2 block">Speaker A (You)</label>
          <input className="input" placeholder="Your name" value={speakerA} onChange={e => setSpeakerA(e.target.value)} />
        </div>
        <div>
          <label className="label mb-2 block">Speaker B (Them)</label>
          <input className="input" placeholder="Their name" value={speakerB} onChange={e => setSpeakerB(e.target.value)} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "paste" ? (
          <motion.div key="paste" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            <div className="card p-5 mb-4">
              <label className="label mb-2 block">Conversation Text</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste your conversation here...&#10;&#10;You: Hey, how are you?&#10;Them: I'm good, thanks for asking..."
                rows={12}
                className="input font-mono"
                style={{ resize: "vertical", lineHeight: 1.6 }}
              />
              <p className="label mt-2">{text.length} characters</p>
            </div>
            <button onClick={handlePasteSubmit} disabled={loading} className="btn btn-primary w-full">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Analyse Conversation →"}
            </button>
          </motion.div>
        ) : (
          <motion.div key="upload" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            <div className="card p-5 mb-4">
              <input ref={fileRef} type="file" title="Conversation text" accept="image/*,.txt,.csv" className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)} />
              <button onClick={() => fileRef.current?.click()}
                className="w-full py-12 rounded flex flex-col items-center justify-center gap-3 transition-all"
                style={{ border: "2px dashed var(--line)", background: "var(--surface)" }}>
                <span className="text-3xl" style={{ color: "#3457d5" }}>↑</span>
                {file ? (
                  <div className="text-center">
                    <p className="font-display font-semibold text-sm" style={{ color: "#171a20" }}>{file.name}</p>
                    <p className="label mt-1">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-display font-semibold text-sm" style={{ color: "#171a20" }}>Click to upload</p>
                    <p className="label mt-1">Screenshot, .txt, or .csv</p>
                  </div>
                )}
              </button>
            </div>
            <button onClick={handleFileSubmit} disabled={loading || !file} className="btn btn-primary w-full">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Upload & Analyse →"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
