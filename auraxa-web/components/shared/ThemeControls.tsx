"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";

// ── Sun / Moon mode toggle ────────────────────────────────
export function ModeToggle() {
  const { resolvedMode, toggleMode } = useTheme();
  const isDark = resolvedMode === "dark";

  return (
    <button
      onClick={toggleMode}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="relative w-9 h-9 rounded-full flex items-center justify-center transition-colors"
      style={{
        background: "var(--surface-alt)",
        border: "1px solid var(--line)",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.svg
            key="moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0,  scale: 1 }}
            exit={{    opacity: 0, rotate: 90,  scale: 0.5 }}
            transition={{ duration: 0.25 }}
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </motion.svg>
        ) : (
          <motion.svg
            key="sun"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0,  scale: 1 }}
            exit={{    opacity: 0, rotate: 90,  scale: 0.5 }}
            transition={{ duration: 0.25 }}
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </motion.svg>
        )}
      </AnimatePresence>
    </button>
  );
}

// ── Theme picker dropdown ─────────────────────────────────
export function ThemePicker() {
  const { themeId, setThemeId, availableThemes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = availableThemes.find((t) => t.id === themeId);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 h-9 rounded-full transition-colors"
        style={{ background: "var(--surface-alt)", border: "1px solid var(--line)" }}
      >
        <div className="flex gap-1">
          {current && [current.light.primary, current.light.secondary, current.light.accent].map((c, i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
          {current?.name ?? "Theme"}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden z-50 p-1.5"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
            }}
          >
            {availableThemes.map((t) => (
              <button
                key={t.id}
                onClick={() => { setThemeId(t.id); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left"
                style={{
                  background: t.id === themeId ? "var(--surface-alt)" : "transparent",
                }}
              >
                <div className="flex gap-1 flex-shrink-0">
                  {[t.light.primary, t.light.secondary, t.light.accent].map((c, i) => (
                    <span key={i} className="w-3 h-3 rounded-full" style={{ background: c, border: "1px solid var(--line)" }} />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{t.name}</p>
                  <p className="text-[10px] truncate" style={{ color: "var(--muted)" }}>{t.category}</p>
                </div>
                {t.id === themeId && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Combined control ──────────────────────────────────────
export default function ThemeControls() {
  return (
    <div className="flex items-center gap-2">
      <ThemePicker />
      <ModeToggle />
    </div>
  );
}
