import type { Metadata, Viewport } from "next";
import { Montserrat, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Providers from "@/components/shared/Providers";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"], variable: "--font-montserrat",
  weight: ["400","500","600","700","800"], display: "swap",
});
const inter = Inter({
  subsets: ["latin"], variable: "--font-inter",
  weight: ["300","400","500","600","700"], display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"], variable: "--font-mono-var",
  weight: ["400","500"], display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://auraxa.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Auraxa — Feel The Unsaid",
    template: "%s | Auraxa",
  },
  description:
    "Upload your WhatsApp, Telegram, or Instagram chats. Get AI relationship scores, Gen Z shareable cards, and emotional insights in 60 seconds.",
  keywords: [
    "relationship analysis", "emotional intelligence", "AI", "WhatsApp analysis",
    "compatibility score", "Gen Z", "astrology", "attachment style",
    "toxic relationship", "ghosting", "auraxa",
  ],
  authors: [{ name: "Aditya Sharma", url: "https://instagram.com/iaddy29" }],
  creator: "Aditya Sharma",
  publisher: "Auraxa",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "Auraxa",
    title: "Auraxa — Feel The Unsaid",
    description: "AI-powered relationship analysis. Upload any chat, get your score in 60 seconds.",
    images: [
      {
        url: `${BASE_URL}/og-default.png`,
        width: 1200,
        height: 630,
        alt: "Auraxa — Feel The Unsaid",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Auraxa — Feel The Unsaid",
    description: "AI-powered relationship analysis. Upload any chat, get your score in 60 seconds.",
    images: [`${BASE_URL}/og-default.png`],
    creator: "@iaddy29",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: BASE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body className="font-body antialiased" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
        <Providers>
          <div className="mesh-bg" aria-hidden="true">
            <div className="mesh-blob mesh-blob-1" />
            <div className="mesh-blob mesh-blob-2" />
            <div className="mesh-blob mesh-blob-3" />
          </div>
          <div className="relative z-10">{children}</div>
        </Providers>
        <Toaster position="top-right" toastOptions={{
          style: {
            background: "rgba(255,255,255,0.96)",
            border: "1px solid rgba(0,0,0,.10)",
            color: "#1e1a2e",
            backdropFilter: "blur(12px)",
            fontFamily: "var(--font-inter)",
            fontSize: "13px",
            borderRadius: "4px",
          },
        }} />
      </body>
    </html>
  );
}
