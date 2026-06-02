"use client";

import {
  createContext, useContext, useEffect, useState, useCallback, ReactNode,
} from "react";
import { THEMES, DEFAULT_THEME, themeToCssVars, ThemeTokens } from "@/lib/themes";

type Mode = "light" | "dark" | "system";

interface ThemeContextValue {
  themeId:    string;
  mode:       Mode;
  resolvedMode: "light" | "dark";
  theme:      ThemeTokens;
  setThemeId: (id: string) => void;
  setMode:    (m: Mode) => void;
  toggleMode: () => void;
  availableThemes: ThemeTokens[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_THEME = "auraxa-theme";
const STORAGE_MODE  = "auraxa-mode";

function getSystemMode(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<string>(DEFAULT_THEME);
  const [mode,    setModeState]    = useState<Mode>("dark");
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  // Load persisted prefs on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_THEME);
    const savedMode  = localStorage.getItem(STORAGE_MODE) as Mode | null;
    if (savedTheme && THEMES[savedTheme]) setThemeIdState(savedTheme);
    if (savedMode) setModeState(savedMode);
    setMounted(true);
  }, []);

  // Resolve & apply theme whenever it changes
  useEffect(() => {
    if (!mounted) return;

    const resolved = mode === "system" ? getSystemMode() : mode;
    setResolvedMode(resolved);

    const theme = THEMES[themeId] ?? THEMES[DEFAULT_THEME];
    const vars  = themeToCssVars(theme, resolved);

    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));

    root.setAttribute("data-theme", themeId);
    root.setAttribute("data-mode", resolved);
    root.classList.toggle("dark", resolved === "dark");

    localStorage.setItem(STORAGE_THEME, themeId);
    localStorage.setItem(STORAGE_MODE, mode);
  }, [themeId, mode, mounted]);

  // Listen for system changes when in system mode
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolvedMode(getSystemMode());
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const setThemeId = useCallback((id: string) => {
    if (THEMES[id]) setThemeIdState(id);
  }, []);

  const setMode = useCallback((m: Mode) => setModeState(m), []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const current = prev === "system" ? getSystemMode() : prev;
      return current === "dark" ? "light" : "dark";
    });
  }, []);

  const value: ThemeContextValue = {
    themeId,
    mode,
    resolvedMode,
    theme: THEMES[themeId] ?? THEMES[DEFAULT_THEME],
    setThemeId,
    setMode,
    toggleMode,
    availableThemes: Object.values(THEMES),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
