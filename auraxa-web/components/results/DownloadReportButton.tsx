"use client";

import { useState } from "react";
import { toast } from "sonner";

export function DownloadReportButton({ result }: { result: any }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const { generateReportPDF } = await import("./generateReportPDF");
      await generateReportPDF(result);
      toast.success("Report downloaded!");
    } catch (e) {
      console.error(e);
      toast.error("Download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="btn btn-secondary inline-flex items-center gap-2"
      style={{ fontSize: "11px", padding: "8px 16px" }}
      title="Download full PDF report"
    >
      {loading ? (
        <div
          className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--line-2)", borderTopColor: "var(--primary)" }}
        />
      ) : (
        <svg
          width="13" height="13" viewBox="0 0 24 24"
          fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )}
      {loading ? "Generating..." : "Download PDF"}
    </button>
  );
}
