import { Metadata } from "next";
import Link from "next/link";

interface PublicReport {
  id: string;
  analysis: {
    speakers: { a: string; b: string };
    message_count: number;
    scores: {
      overall_score: number;
      compatibility_score: number;
      toxicity_level: string;
      ghosting_risk: string;
      attachment_style: string;
      patterns_detected: string[];
      ai_narrative: string;
      speaker_a_percentage: number;
      speaker_b_percentage: number;
    };
  };
  view_count: number;
  created_at: string;
}

async function getPublicReport(token: string): Promise<PublicReport | null> {
  try {
    const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${apiUrl}/api/reports/public/${token}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const TOXICITY_COLOR: Record<string, string> = {
  low: "text-green-400", medium: "text-amber-400", high: "text-orange-400", critical: "text-red-400",
};
const GHOST_COLOR: Record<string, string> = {
  low: "text-green-400", medium: "text-amber-400", high: "text-red-400",
};

// Next.js 15 — params is a Promise
type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const report = await getPublicReport(token);
  if (!report) return { title: "Report Not Found | Auraxa" };
  const { scores, speakers } = report.analysis;
  return {
    title: `${speakers.a} & ${speakers.b} — ${scores.compatibility_score}% Compatible | Auraxa`,
    description: `Emotional compatibility: ${scores.compatibility_score}%. Ghosting risk: ${scores.ghosting_risk}. Analysed by Auraxa AI.`,
  };
}

export default async function PublicReportPage({ params }: Props) {
  const { token } = await params;
  const report = await getPublicReport(token);

  if (!report) {
    return (
      <main className="min-h-screen bg-[#07070c] flex flex-col items-center justify-center px-6 text-center">
        <p className="font-syne text-2xl font-700 text-white/50 mb-3">Report Not Found</p>
        <p className="text-white/25 text-sm mb-8">This report may have been deleted or made private.</p>
        <Link href="/" className="px-6 py-2.5 bg-violet-500/15 border border-violet-500/25 text-violet-300 text-sm rounded-xl hover:bg-violet-500/25 transition-all">
          Try Auraxa Free →
        </Link>
      </main>
    );
  }

  const { analysis } = report;
  const { scores, speakers } = analysis;

  return (
    <main className="min-h-screen bg-[#07070c]">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
        <Link href="/"><p className="font-syne font-black text-base tracking-widest text-violet-300">AURAXA</p></Link>
        <Link href="/login" className="px-4 py-2 bg-violet-500 hover:bg-violet-400 text-white text-sm font-syne font-600 rounded-xl transition-all duration-200">
          Analyse Yours Free
        </Link>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <p className="font-mono text-[10px] text-violet-400/50 uppercase tracking-widest mb-3">Shared Analysis</p>
          <h1 className="font-syne text-3xl font-800 tracking-tight mb-2">{speakers.a} &amp; {speakers.b}</h1>
          <p className="text-white/30 text-sm">{analysis.message_count} messages · {report.view_count} views</p>
        </div>

        <div className="glass-accent rounded-2xl p-8 text-center mb-6">
          <p className="font-syne font-black text-7xl text-violet-300">{scores.compatibility_score}%</p>
          <p className="text-white/40 text-base mt-2">Emotional Compatibility</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass rounded-xl p-4 text-center">
            <p className="font-syne font-700 text-xl text-teal-300">{scores.overall_score}</p>
            <p className="text-[11px] text-white/25 mt-0.5">Health Score</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className={`font-syne font-700 text-xl capitalize ${TOXICITY_COLOR[scores.toxicity_level] ?? "text-white/60"}`}>{scores.toxicity_level}</p>
            <p className="text-[11px] text-white/25 mt-0.5">Toxicity</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className={`font-syne font-700 text-xl capitalize ${GHOST_COLOR[scores.ghosting_risk] ?? "text-white/60"}`}>{scores.ghosting_risk}</p>
            <p className="text-[11px] text-white/25 mt-0.5">Ghost Risk</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 mb-6">
          <p className="font-syne font-600 text-sm mb-3">Communication Balance</p>
          <div className="flex justify-between text-xs text-white/30 mb-2">
            <span>{speakers.a} — {scores.speaker_a_percentage}%</span>
            <span>{speakers.b} — {scores.speaker_b_percentage}%</span>
          </div>
          <div className="h-2.5 bg-white/[0.05] rounded-full overflow-hidden flex">
            <div className="h-full bg-violet-400/70 rounded-full" style={{ width: `${scores.speaker_a_percentage}%` }} />
            <div className="h-full bg-teal-400/50 rounded-full" style={{ width: `${scores.speaker_b_percentage}%` }} />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 mb-6">
          <p className="font-syne font-600 text-sm mb-3">Patterns Detected</p>
          <div className="flex flex-wrap gap-2">
            {scores.patterns_detected.map((p) => (
              <span key={p} className="text-sm px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50">{p}</span>
            ))}
          </div>
        </div>

        <div className="glass-accent rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-violet-400/60">◈</span>
            <p className="font-syne font-600 text-sm text-violet-300/80">AI Summary</p>
          </div>
          <p className="text-sm text-white/45 leading-relaxed italic">&ldquo;{scores.ai_narrative}&rdquo;</p>
        </div>

        <div className="text-center">
          <p className="text-white/30 text-sm mb-4">Want to analyse your own conversations?</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-8 py-3.5 bg-violet-500 hover:bg-violet-400 text-white font-syne font-700 rounded-2xl text-base transition-all duration-200 shadow-lg shadow-violet-500/20">
            Try Auraxa Free →
          </Link>
          <p className="text-[11px] text-white/15 mt-3 font-mono">No credit card · 3 free analyses</p>
        </div>
      </div>
    </main>
  );
}