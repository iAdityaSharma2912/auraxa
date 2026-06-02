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
  const [file, setFile] = useState<File|null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePaste = async () => {
    if (text.trim().length < 20) { toast.error("Please paste a longer conversation."); return; }
    setLoading(true);
    try {
      const res = await api.post("/api/analyze/paste", { text, intent:"conversation" });
      const id = res.data?.analysis_id ?? res.data?.id;
      toast.success("Analysis started!");
      router.push(`/results/${id}`);
    } catch(e:any) { toast.error(e?.response?.data?.detail||"Analysis failed."); }
    finally { setLoading(false); }
  };

  const handleUpload = async () => {
    if (!file) { toast.error("Please select a file."); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      fd.append("intent", "conversation");
      const res = await api.post("/api/analyze/upload", fd);
      const id = res.data?.analysis_id ?? res.data?.id;
      toast.success("Analysis started!");
      router.push(`/results/${id}`);
    } catch(e:any) { toast.error(e?.response?.data?.detail||"Upload failed."); }
    finally { setLoading(false); }
  };

  const Spinner = () => <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>;

  return (
    <div className="px-3 sm:px-5 md:px-8 py-4 md:py-8 max-w-2xl">
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="mb-6">
        <p className="label mb-2" style={{ fontSize:"9px", color:"var(--primary)" }}>New Reading</p>
        <h1 className="font-display font-bold" style={{ fontSize:"clamp(1.3rem,5vw,1.875rem)", color:"var(--text)" }}>Analyse a Conversation</h1>
        <p className="text-sm mt-1 leading-relaxed" style={{ color:"var(--muted)" }}>Paste a chat or upload a screenshot.</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded mb-5" style={{ background:"var(--surface-alt)" }}>
        {(["paste","upload"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className="flex-1 py-2.5 rounded text-sm font-display font-bold transition-all"
            style={t===tab?{background:"var(--bg)",color:"var(--text)",boxShadow:"var(--shadow-sm)"}:{color:"var(--muted)"}}>
            {t==="paste"?"Paste Text":"Upload File"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab==="paste"?(
          <motion.div key="paste" initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }} transition={{ duration:.18 }}>
            <div className="card p-4 mb-4">
              <label className="label mb-2 block" style={{ fontSize:"9px" }}>Conversation Text</label>
              <textarea title="Conversation text" value={text} onChange={e=>setText(e.target.value)}
                placeholder={"Paste your conversation here...\n\nYou: Hey, how are you?\nThem: I'm good..."}
                rows={10} className="input font-mono"
                style={{ resize:"vertical", lineHeight:1.6, fontSize:"13px" }}/>
              <p className="label mt-2" style={{ fontSize:"9px" }}>{text.length} characters</p>
            </div>
            <button onClick={handlePaste} disabled={loading} className="btn btn-primary w-full">
              {loading?<Spinner/>:"Analyse Conversation →"}
            </button>
          </motion.div>
        ):(
          <motion.div key="upload" initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }} transition={{ duration:.18 }}>
            <div className="card p-4 mb-4">
              <input ref={fileRef} type="file" title="Upload file" accept="image/*,.txt,.csv" className="hidden"
                onChange={e=>setFile(e.target.files?.[0]??null)}/>
              <button onClick={()=>fileRef.current?.click()}
                className="w-full py-10 sm:py-14 rounded flex flex-col items-center justify-center gap-3"
                style={{ border:"2px dashed var(--line-2)", background:"var(--surface)" }}>
                <span className="text-3xl" style={{ color:"var(--primary)" }}>↑</span>
                {file?(
                  <div className="text-center px-4">
                    <p className="font-display font-bold text-sm" style={{ color:"var(--text)" }}>{file.name}</p>
                    <p className="label mt-1" style={{ fontSize:"9px" }}>{(file.size/1024).toFixed(0)} KB · Tap to change</p>
                  </div>
                ):(
                  <div className="text-center">
                    <p className="font-display font-bold text-sm" style={{ color:"var(--text)" }}>Tap to upload</p>
                    <p className="label mt-1" style={{ fontSize:"9px" }}>Screenshot, .txt, or .csv · Max 10MB</p>
                  </div>
                )}
              </button>
            </div>
            <button onClick={handleUpload} disabled={loading||!file} className="btn btn-primary w-full">
              {loading?<Spinner/>:"Upload & Analyse →"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
