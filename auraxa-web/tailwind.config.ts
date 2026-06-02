import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:           "var(--bg)",
        "bg-2":       "var(--bg-2)",
        surface:      "var(--surface)",
        "surface-alt":"var(--surface-alt)",
        text:         "var(--text)",
        muted:        "var(--muted)",
        line:         "var(--line)",
        primary:      "var(--primary)",
        secondary:    "var(--secondary)",
        accent:       "var(--accent)",
      },
      fontFamily: {
        display: ["var(--font-montserrat)", "sans-serif"],
        body:    ["var(--font-inter)", "sans-serif"],
        mono:    ["var(--font-mono-var)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "5px",
        sm:      "4px",
        lg:      "8px",
      },
      boxShadow: {
        sm:  "0 1px 2px rgba(0,0,0,.04), 0 1px 3px rgba(0,0,0,.06)",
        DEFAULT: "0 2px 8px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)",
        lg:  "0 8px 24px rgba(0,0,0,.08), 0 16px 48px rgba(0,0,0,.06)",
      },
      animation: {
        "fade-up":  "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
        "shimmer":  "shimmer 1.8s infinite",
        "scroll":   "scroll-indicator 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "scroll-indicator": {
          "0%, 100%": { opacity: "0.3", transform: "translateY(0)" },
          "50%":      { opacity: "0.9", transform: "translateY(8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
