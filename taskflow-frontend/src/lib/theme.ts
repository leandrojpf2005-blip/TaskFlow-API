// Theme = light / dark, Uplift "Momentum" look (orange accent).
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
  { key: "light", label: "Light", tagline: "Clean & bright", dots: ["#F6F5F1", "#E8501A", "#F2A83B"] },
  { key: "dark", label: "Dark", tagline: "Easy on the eyes", dots: ["#0F1319", "#FF7A3D", "#F5B95C"] },
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
