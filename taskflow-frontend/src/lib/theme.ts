// Theme registry + persistence. Themes are CSS variable sets in App.css,
// switched by stamping data-theme on <html>. Macro/chart colors in every theme
// were validated with the dataviz palette checker (CVD, contrast, lightness band).

export type ThemeKey = "midnight" | "daylight" | "ocean" | "ember";

export interface ThemeDef {
  key: ThemeKey;
  label: string;
  tagline: string;
  /** swatch dots shown in the picker: [background, primary, accent] */
  dots: [string, string, string];
}

export const THEMES: ThemeDef[] = [
  {
    key: "midnight",
    label: "Midnight",
    tagline: "Near-black with lime energy",
    dots: ["#0a0d0a", "#bdf34e", "#dc4a56"],
  },
  {
    key: "daylight",
    label: "Daylight",
    tagline: "Soft paper & garden green",
    dots: ["#edf0e8", "#3d8c28", "#e26a3c"],
  },
  {
    key: "ocean",
    label: "Ocean",
    tagline: "Deep blue with cool cyan",
    dots: ["#071019", "#3ec3e8", "#8f6ae0"],
  },
  {
    key: "ember",
    label: "Ember",
    tagline: "Warm charcoal & amber",
    dots: ["#120b07", "#ff9e3d", "#e04a63"],
  },
];

const STORAGE_KEY = "coachfuel_theme";
const DEFAULT_THEME: ThemeKey = "midnight";

export function getSavedTheme(): ThemeKey {
  const saved = localStorage.getItem(STORAGE_KEY);
  return THEMES.some((t) => t.key === saved) ? (saved as ThemeKey) : DEFAULT_THEME;
}

export function applyTheme(key: ThemeKey) {
  document.documentElement.dataset.theme = key;
  localStorage.setItem(STORAGE_KEY, key);
}

/** Call once before first render to avoid a flash of the default theme. */
export function initTheme() {
  applyTheme(getSavedTheme());
}
