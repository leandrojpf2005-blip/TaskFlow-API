// Theme = light / dark, Uplift look (sage accent).
// Stamped as data-theme on <html>; palettes live in index.css.

export type ThemeKey = "light" | "dark";

export interface ThemeDef {
  key: ThemeKey;
  label: string;
  tagline: string;
  /** swatch dots: [background, primary, accent] */
  dots: [string, string, string];
}

export const THEMES: ThemeDef[] = [
  { key: "light", label: "Light", tagline: "Clean & bright", dots: ["#F8F7F2", "#5B9279", "#E3EDE7"] },
  { key: "dark", label: "Dark", tagline: "Easy on the eyes", dots: ["#121614", "#6EA98D", "#1E2B24"] },
];

const STORAGE_KEY = "uplift_theme";
const DEFAULT_THEME: ThemeKey = "light";

export function getSavedTheme(): ThemeKey {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (THEMES.some((t) => t.key === saved)) return saved as ThemeKey;
  } catch {
    /* storage blocked */
  }
  return DEFAULT_THEME;
}

export function applyTheme(key: ThemeKey) {
  document.documentElement.dataset.theme = key;
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    /* storage blocked */
  }
}

/** Call once before first render to avoid a flash of the default theme. */
export function initTheme() {
  applyTheme(getSavedTheme());
}
