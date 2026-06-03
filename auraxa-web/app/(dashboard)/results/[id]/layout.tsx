import type { Metadata } from "next";

const BASE_URL     = process.env.NEXT_PUBLIC_APP_URL  || "https://auraxa.app";
const INTERNAL_API = process.env.INTERNAL_API_URL     || "http://api:8000";

async function fetchMeta(id: string) {
  try {
    const res = await fetch(`${INTERNAL_API}/api/analyze/${id}/results`, {
      headers: { "X-Internal-Request": "metadata" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchMeta(id);

  if (!data?.scores) {
    return {
      title: "Analysis Result | Auraxa",
      description: "View your Auraxa relationship analysis.",
    };
  }

  const score    = data.scores.overall_score ?? 0;
  const speakerA = data.speakers?.a ?? "You";
  const speakerB = data.speakers?.b ?? "Them";
  const verdict  = data.genz_verdict ?? "";
  const ogImage  = `${BASE_URL}/results/${id}/opengraph-image`;

  const title = `${speakerA} & ${speakerB} scored ${score}/100 on Auraxa`;
  const desc  = verdict
    ? `"${verdict}" — See the full emotional analysis.`
    : `Compatibility, toxicity, ghosting risk and more — scored ${score}/100.`;

  return {
    title,
    description: desc,
    openGraph: {
      title, description: desc,
      url: `${BASE_URL}/results/${id}`,
      siteName: "Auraxa", type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title, description: desc,
      images: [ogImage], creator: "@iaddy29",
    },
  };
}

export default function ResultLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}