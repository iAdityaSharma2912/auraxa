"use client";

import { useRef, useState } from "react";
import { AnalysisResult } from "@/types";
import { toast } from "sonner";

interface ShareCardProps {
  analysis: AnalysisResult;
  onClose: () => void;
}

const TOXICITY_EMOJI = { low: "🟢", medium: "🟡", high: "🟠", critical: "🔴" };
const GHOST_EMOJI    = { low: "🟢", medium: "🟡", high: "🔴" };

export default function ShareCard({ analysis, onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const { scores, speakers } = analysis;

  const handleDownload = async () => {
    setCopying(true);
    try {
      // Dynamic import to keep bundle small
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current!, {
        backgroundColor: "#07070c",
        useCORS: true,
      } as any);
      const link = document.createElement("a");
      link.download = `auraxa-${analysis.id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Card downloaded!");
    } catch {
      toast.error("Download failed. Try screenshotting the card instead.");
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md">
        {/* The actual card — this gets captured */}
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-2xl p-7"
          style={{
            background: "linear-gradient(135deg, #0e0e18 0%, #13131f 50%, #1a1a2a 100%)",
            border: "1px solid rgba(167,139,250,0.2)",
          }}
        >
          {/* Glow bg */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-violet-500/10 blur-3xl rounded-full pointer-events-none" />

          {/* Header */}
          <div className="flex items-start justify-between mb-6 relative">
            <div>
              <p className="font-mono text-[10px] text-violet-400/60 uppercase tracking-widest mb-1">Auraxa Analysis</p>
              <p className="font-syne font-700 text-base text-white/80">
                {speakers?.a ?? "You"} &amp; {speakers?.b ?? "Them"}
              </p>
            </div>
            <p className="font-syne font-black text-sm tracking-widest text-violet-300/70">AURAXA</p>
          </div>

          {/* Main score */}
          <div className="text-center mb-6 relative">
            <p className="font-syne font-black text-6xl text-violet-300">{scores?.compatibility_score ?? 0}%</p>
            <p className="text-white/30 text-sm mt-1">Emotional Compatibility</p>
          </div>

          {/* Score grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Health Score", value: `${scores?.overall_score ?? 0}/100`, color: "text-teal-300" },
              { label: "Toxicity",     value: scores?.toxicity_level ?? "—",       color: "text-white/60", capitalize: true },
              { label: "Ghost Risk",   value: scores?.ghosting_risk ?? "—",        color: "text-white/60", capitalize: true },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className={`font-syne font-700 text-sm ${s.color} ${s.capitalize ? "capitalize" : ""}`}>{s.value}</p>
                <p className="text-[10px] text-white/25 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Patterns */}
          <div className="mb-6">
            <p className="text-[10px] font-mono text-white/25 uppercase tracking-widest mb-2">Patterns Detected</p>
            <div className="flex flex-wrap gap-2">
              {(scores?.patterns_detected ?? []).slice(0, 4).map((p) => (
                <span key={p} className="text-[11px] px-2.5 py-1 rounded-lg text-white/45" style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.15)" }}>
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Attachment style */}
          <div className="p-3 rounded-xl mb-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-mono text-white/25 uppercase tracking-widest mb-1">Attachment Style</p>
            <p className="font-syne font-600 text-sm text-pink-300 capitalize">{scores?.attachment_style ?? "—"}</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] text-white/20 italic">Feel The Unsaid.</p>
            <p className="text-[10px] font-mono text-white/20">auraxa.app</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleDownload}
            disabled={copying}
            className="flex-1 py-3 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white font-syne font-600 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            {copying ? (
              <><div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
            ) : (
              "↓ Download Card"
            )}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 border border-white/[0.10] hover:border-white/[0.20] text-white/40 hover:text-white/70 rounded-xl text-sm transition-all duration-200"
          >
            Close
          </button>
        </div>
        <p className="text-center text-[11px] text-white/15 mt-3">
          Or screenshot the card above to share directly
        </p>
      </div>
    </div>
  );
}
