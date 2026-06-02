// ════════════════════════════════════════════════════════
//  AURAXA THEME SYSTEM
//  Token-driven theming. Each theme defines light values;
//  dark values are derived or explicitly set.
// ════════════════════════════════════════════════════════

export interface ThemeColors {
  bg:         string;
  bg2:        string;
  surface:    string;
  surfaceAlt: string;
  text:       string;
  muted:      string;
  line:       string;
  primary:    string;
  secondary:  string;
  accent:     string;
}

export interface ThemeTokens {
  id:    string;
  name:  string;
  category: string;
  vibe:  string[];
  fonts: {
    display: string;
    body:    string;
    mono:    string;
  };
  radius: {
    base:  string;
    small: string;
    large: string;
  };
  background: "mesh-soft" | "aurora" | "particles" | "none";
  light: ThemeColors;
  dark:  ThemeColors;
}

// ── Tesla Inspired ────────────────────────────────────────
export const teslaTheme: ThemeTokens = {
  id:       "tesla",
  name:     "Tesla Inspired",
  category: "Automotive",
  vibe:     ["engineering", "premium", "minimal"],
  fonts: {
    display: "Montserrat",
    body:    "Inter",
    mono:    "JetBrains Mono",
  },
  radius: { base: "5px", small: "4px", large: "8px" },
  background: "mesh-soft",
  light: {
    bg:         "#ffffff",
    bg2:        "#f4f4f4",
    surface:    "#fafafa",
    surfaceAlt: "#efefef",
    text:       "#171a20",
    muted:      "#5c5e62",
    line:       "rgba(0,0,0,.10)",
    primary:    "#171a20",
    secondary:  "#3457d5",
    accent:     "#cc0000",
  },
  dark: {
    bg:         "#0d0e10",
    bg2:        "#16181b",
    surface:    "#1a1c1f",
    surfaceAlt: "#212327",
    text:       "#f4f4f5",
    muted:      "#9ca0a6",
    line:       "rgba(255,255,255,.10)",
    primary:    "#ffffff",
    secondary:  "#5b7cf0",
    accent:     "#ff4d4d",
  },
};

// ── Roam Travel ───────────────────────────────────────────
export const roamTheme: ThemeTokens = {
  id:       "roam",
  name:     "Roam — Travel",
  category: "Mobile · Travel",
  vibe:     ["adventurous", "clean", "aspirational"],
  fonts: {
    display: "Montserrat",
    body:    "Inter",
    mono:    "JetBrains Mono",
  },
  radius: { base: "18px", small: "12px", large: "24px" },
  background: "mesh-soft",
  light: {
    bg:         "#f4fbfb",
    bg2:        "#e6f4f5",
    surface:    "#ffffff",
    surfaceAlt: "#eef8f8",
    text:       "#0f2a30",
    muted:      "#5a7d83",
    line:       "rgba(14,165,180,.16)",
    primary:    "#0ea5b4",
    secondary:  "#ff8a5b",
    accent:     "#1f7ae0",
  },
  dark: {
    bg:         "#071417",
    bg2:        "#0a1c20",
    surface:    "#0e2429",
    surfaceAlt: "#123036",
    text:       "#e8f6f7",
    muted:      "#7da8af",
    line:       "rgba(14,165,180,.22)",
    primary:    "#14c4d6",
    secondary:  "#ff9d72",
    accent:     "#3b92f0",
  },
};

// ── Auraxa Cosmic (the original) ──────────────────────────
export const cosmicTheme: ThemeTokens = {
  id:       "cosmic",
  name:     "Auraxa Cosmic",
  category: "Mystical",
  vibe:     ["mystical", "premium", "immersive"],
  fonts: {
    display: "Cinzel",
    body:    "Plus Jakarta Sans",
    mono:    "JetBrains Mono",
  },
  radius: { base: "16px", small: "10px", large: "24px" },
  background: "aurora",
  light: {
    bg:         "#f6f4ff",
    bg2:        "#ece8fb",
    surface:    "#ffffff",
    surfaceAlt: "#f3f0fc",
    text:       "#1a1335",
    muted:      "#6b6390",
    line:       "rgba(124,58,237,.14)",
    primary:    "#7c3aed",
    secondary:  "#d4af37",
    accent:     "#e879f9",
  },
  dark: {
    bg:         "#030309",
    bg2:        "#0a0a22",
    surface:    "#10102e",
    surfaceAlt: "#16163a",
    text:       "#f4f2ff",
    muted:      "#9b93c0",
    line:       "rgba(124,58,237,.20)",
    primary:    "#a78bfa",
    secondary:  "#d4af37",
    accent:     "#e879f9",
  },
};

export const THEMES: Record<string, ThemeTokens> = {
  cosmic: cosmicTheme,
  tesla:  teslaTheme,
  roam:   roamTheme,
};

export const DEFAULT_THEME = "cosmic";

// ── Convert theme to CSS variables ────────────────────────
export function themeToCssVars(theme: ThemeTokens, mode: "light" | "dark"): Record<string, string> {
  const c = mode === "dark" ? theme.dark : theme.light;
  return {
    "--bg":          c.bg,
    "--bg-2":        c.bg2,
    "--surface":     c.surface,
    "--surface-alt": c.surfaceAlt,
    "--text":        c.text,
    "--muted":       c.muted,
    "--line":        c.line,
    "--primary":     c.primary,
    "--secondary":   c.secondary,
    "--accent":      c.accent,
    "--radius":      theme.radius.base,
    "--radius-sm":   theme.radius.small,
    "--radius-lg":   theme.radius.large,
    "--font-display": `'${theme.fonts.display}', sans-serif`,
    "--font-body":    `'${theme.fonts.body}', sans-serif`,
    "--font-mono":    `'${theme.fonts.mono}', monospace`,
  };
}
