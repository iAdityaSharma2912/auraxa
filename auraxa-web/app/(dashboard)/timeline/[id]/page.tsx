"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getAnalysisResults } from "@/lib/api";
import { AnalysisResult } from "@/types";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from "recharts";

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs font-mono space-y-1">
      <p className="text-white/30">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-violet-300">{p.value}</p>
      ))}
    </div>
  );
}

export default function TimelinePage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getAnalysisResults(id as string)
      .then(setAnalysis)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!analysis || !analysis.timeline?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-white/40">Timeline data not available.</p>
        <Link href="/reports" className="text-violet-400/60 text-sm hover:text-violet-400/80 transition-colors">
          ← Back to Reports
        </Link>
      </div>
    );
  }

  const chartData = analysis.timeline.map((t, i) => ({
    name: `${i + 1}`,
    intensity: t.emotional_intensity,
    sentiment: t.sentiment === "positive" ? 1 : t.sentiment === "negative" ? -1 : 0,
  }));

  // Speaker message counts
  const aCount = analysis.timeline.filter(t => t.speaker === "a").length;
  const bCount = analysis.timeline.filter(t => t.speaker === "b").length;
  const speakerData = [
    { name: analysis.speakers?.a ?? "You",  messages: aCount,  fill: "#a78bfa" },
    { name: analysis.speakers?.b ?? "Them", messages: bCount,  fill: "#2dd4bf" },
  ];

  return (
    <div className="px-8 py-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-10 flex-wrap gap-4"
      >
        <div>
          <Link
            href={`/results/${id}`}
            className="text-[11px] font-mono text-white/25 hover:text-white/50 transition-colors"
          >
            ← Back to Results
          </Link>
          <h1 className="font-syne text-2xl font-800 tracking-tight mt-2">Emotional Timeline</h1>
          <p className="text-white/30 text-sm mt-1">
            {analysis.speakers?.a} &amp; {analysis.speakers?.b} ·{" "}
            {analysis.message_count} messages
          </p>
        </div>
      </motion.div>

      {/* Chart 1 — Emotional Intensity */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6 mb-6"
      >
        <div className="mb-5">
          <p className="font-syne font-600 text-sm">Emotional Intensity Over Time</p>
          <p className="text-xs text-white/25 mt-0.5">How emotionally charged the conversation was throughout</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="intensityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="name" hide />
            <YAxis domain={[0, 100]} hide />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={50} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            <Area
              type="monotone" dataKey="intensity"
              stroke="#a78bfa" strokeWidth={2}
              fill="url(#intensityGrad)"
              dot={false} activeDot={{ r: 4, fill: "#c4b5fd" }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex justify-between text-[10px] font-mono text-white/20 mt-2 px-1">
          <span>Start</span>
          <span>End</span>
        </div>
      </motion.div>

      {/* Chart 2 — Sentiment flow */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass rounded-2xl p-6 mb-6"
      >
        <div className="mb-5">
          <p className="font-syne font-600 text-sm">Sentiment Flow</p>
          <p className="text-xs text-white/25 mt-0.5">Positive (+1), neutral (0), negative (−1) across the conversation arc</p>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="name" hide />
            <YAxis domain={[-1.5, 1.5]} hide />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
            <Line
              type="monotone" dataKey="sentiment"
              stroke="#2dd4bf" strokeWidth={2}
              dot={false} activeDot={{ r: 4, fill: "#5eead4" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Chart 3 — Speaker breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6 mb-6"
      >
        <div className="mb-5">
          <p className="font-syne font-600 text-sm">Message Distribution</p>
          <p className="text-xs text-white/25 mt-0.5">Who spoke more across the conversation timeline</p>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={speakerData} layout="vertical">
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={60} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            {speakerData.map((s) => (
              <Bar key={s.name} dataKey="messages" fill={s.fill} radius={[0, 6, 6, 0]} opacity={0.7} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Key moments */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass rounded-2xl p-6"
      >
        <p className="font-syne font-600 text-sm mb-4">Key Moments</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "Emotional Peak",
              value: `Point ${chartData.reduce((mx, p, i, a) => p.intensity > a[mx].intensity ? i : mx, 0) + 1}`,
              desc: "Highest emotional intensity in the conversation",
              color: "text-violet-300",
            },
            {
              label: "Coldest Point",
              value: `Point ${chartData.reduce((mn, p, i, a) => p.intensity < a[mn].intensity ? i : mn, 0) + 1}`,
              desc: "Lowest emotional engagement detected",
              color: "text-blue-400",
            },
            {
              label: "Positive Messages",
              value: `${analysis.timeline.filter(t => t.sentiment === "positive").length}`,
              desc: "Messages with positive emotional tone",
              color: "text-green-400",
            },
            {
              label: "Negative Messages",
              value: `${analysis.timeline.filter(t => t.sentiment === "negative").length}`,
              desc: "Messages with negative emotional tone",
              color: "text-red-400",
            },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <p className={`font-syne font-700 text-xl mb-1 ${item.color}`}>{item.value}</p>
              <p className="text-[12px] font-600 text-white/50 mb-0.5">{item.label}</p>
              <p className="text-[11px] text-white/25">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
