"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import api from "@/lib/api";

export default function PalmPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: loading,
  });

  const handleAnalyse = async () => {
    if (!file) { toast.error("Please upload a palm photo."); return; }
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post("/api/palm/analyse", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Palm analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const CAPACITY_COLOR: Record<string, string> = {
    "Low": "text-blue-400", "Medium": "text-teal-400",
    "High": "text-violet-300", "Very High": "text-pink-300",
  };

  return (
    <div className="px-8 py-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="font-mono text-[10px] text-violet-400/50 uppercase tracking-widest mb-2">Palm Analysis</p>
        <h1 className="font-syne text-3xl font-800 tracking-tight">Read Your Palm</h1>
        <p className="text-white/35 text-sm mt-2">Upload a clear photo of your palm. AI reads heart, head, and life lines for emotional insights.</p>
      </motion.div>

      {/* Instructions */}
      <div className="glass rounded-2xl p-5 mb-6 flex items-start gap-4">
        <span className="text-violet-400/50 text-xl flex-shrink-0 mt-0.5">◇</span>
        <div>
          <p className="font-syne font-600 text-sm mb-2">For best results</p>
          <ul className="space-y-1 text-xs text-white/35">
            <li>→ Use your dominant hand (right for right-handed)</li>
            <li>→ Flat, open hand with fingers together</li>
            <li>→ Good natural lighting, no shadows</li>
            <li>→ Camera directly above the palm</li>
          </ul>
        </div>
      </div>

      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 mb-6 ${
          isDragActive ? "border-violet-500/60 bg-violet-500/8" :
          file ? "border-violet-500/30 bg-violet-500/4" :
          "border-white/[0.10] hover:border-violet-500/30"
        }`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Palm preview" className="h-48 object-contain rounded-xl" />
            <p className="text-sm text-white/50 font-medium">{file?.name}</p>
            <p className="text-xs text-violet-400/60">Click to change photo</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-3xl">
              ✋
            </div>
            <div>
              <p className="font-syne font-600 text-white/60 mb-1">Drop your palm photo here</p>
              <p className="text-sm text-white/25">JPG, PNG or WEBP · Max 5MB</p>
            </div>
            <button type="button" className="px-5 py-2 bg-violet-500/15 border border-violet-500/25 text-violet-300 text-sm rounded-xl transition-all duration-200">
              Browse Photo
            </button>
          </div>
        )}
      </div>

      {file && (
        <button onClick={handleAnalyse} disabled={loading}
          className="w-full py-4 bg-violet-500 hover:bg-violet-400 disabled:bg-white/[0.05] disabled:text-white/20 text-white font-syne font-700 rounded-2xl text-base transition-all duration-200 flex items-center justify-center gap-3 mb-8"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Reading your palm...</>
          ) : <>Read My Palm ◇</>}
        </button>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Lines */}
            {[
              { key: "heart_line",  label: "Heart Line",  icon: "♡", color: "text-pink-300" },
              { key: "head_line",   label: "Head Line",   icon: "◈", color: "text-teal-300" },
              { key: "life_line",   label: "Life Line",   icon: "⬡", color: "text-violet-300" },
            ].map(({ key, label, icon, color }) => result[key] && (
              <div key={key} className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-lg ${color}`}>{icon}</span>
                  <p className={`font-syne font-600 text-sm ${color}`}>{label}</p>
                  {result[key].emotional_capacity && (
                    <span className={`ml-auto text-xs font-mono ${CAPACITY_COLOR[result[key].emotional_capacity] ?? "text-white/40"}`}>
                      {result[key].emotional_capacity}
                    </span>
                  )}
                  {result[key].thinking_style && (
                    <span className="ml-auto text-xs font-mono text-teal-300/70">{result[key].thinking_style}</span>
                  )}
                </div>
                <p className="text-sm text-white/55 leading-relaxed">{result[key].description}</p>
                {result[key].love_style && (
                  <p className="text-xs text-white/30 mt-2 font-mono">{result[key].love_style}</p>
                )}
                {result[key].communication_pattern && (
                  <p className="text-xs text-white/30 mt-2 font-mono">{result[key].communication_pattern}</p>
                )}
              </div>
            ))}

            {/* Fate line */}
            {result.fate_line && (
              <div className="glass rounded-2xl p-5">
                <p className="font-syne font-600 text-sm text-amber-300/80 mb-2">
                  ◆ Fate Line {!result.fate_line.present && <span className="text-white/30 text-xs font-normal ml-2">(not visible)</span>}
                </p>
                <p className="text-sm text-white/55 leading-relaxed">{result.fate_line.description}</p>
              </div>
            )}

            {/* Overall */}
            {result.overall_personality && (
              <div className="glass rounded-2xl p-5">
                <p className="font-syne font-600 text-sm text-white/60 mb-2">Overall Personality</p>
                <p className="text-sm text-white/55 leading-relaxed">{result.overall_personality}</p>
              </div>
            )}

            {/* Relationship tendencies */}
            {result.relationship_tendencies && (
              <div className="glass rounded-2xl p-5">
                <p className="font-syne font-600 text-sm text-white/60 mb-2">In Relationships</p>
                <p className="text-sm text-white/55 leading-relaxed">{result.relationship_tendencies}</p>
              </div>
            )}

            {/* Indicators + Cautions */}
            <div className="grid grid-cols-2 gap-4">
              {result.emotional_indicators?.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <p className="font-syne font-600 text-sm text-violet-300/80 mb-3">Emotional Traits</p>
                  <ul className="space-y-2">
                    {result.emotional_indicators.map((i: string) => (
                      <li key={i} className="text-xs text-white/50 flex items-start gap-2">
                        <span className="text-violet-400 flex-shrink-0">◦</span>{i}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.caution_points?.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <p className="font-syne font-600 text-sm text-amber-400/80 mb-3">Be Mindful Of</p>
                  <ul className="space-y-2">
                    {result.caution_points.map((c: string) => (
                      <li key={c} className="text-xs text-white/50 flex items-start gap-2">
                        <span className="text-amber-400 flex-shrink-0">△</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Guidance */}
            {result.guidance && (
              <div className="glass-accent rounded-2xl p-5">
                <p className="font-syne font-600 text-sm text-violet-300/80 mb-2">◈ Guidance</p>
                <p className="text-sm text-white/50 leading-relaxed italic">&ldquo;{result.guidance}&rdquo;</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
