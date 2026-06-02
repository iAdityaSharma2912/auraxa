import type { Metadata, Viewport } from "next";
import { Montserrat, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Providers from "@/components/shared/Providers";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-var",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Auraxa — Feel The Unsaid",
    template: "%s | Auraxa",
  },
  description:
    "AI-powered emotional intelligence. Upload any conversation and decode the emotional truth behind every message.",
  keywords: [
    "emotional intelligence", "AI", "astrology", "palmistry",
    "relationship analysis", "conversation analyzer",
  ],
  openGraph: {
    title: "Auraxa — Feel The Unsaid",
    description: "Where ancient wisdom meets modern AI. Decode your relationships.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body antialiased">
        <Providers>
          {/* ── Soft mesh background ── */}
          <div className="mesh-bg" aria-hidden="true">
            <div className="mesh-blob mesh-blob-1" />
            <div className="mesh-blob mesh-blob-2" />
            <div className="mesh-blob mesh-blob-3" />
          </div>
          <div className="relative z-10">
            {children}
          </div>
        </Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(255,255,255,0.95)",
              border: "1px solid rgba(0,0,0,.10)",
              color: "#171a20",
              backdropFilter: "blur(16px)",
              fontFamily: "var(--font-inter)",
              fontSize: "13px",
              borderRadius: "5px",
            },
          }}
        />
      </body>
    </html>
  );
}
