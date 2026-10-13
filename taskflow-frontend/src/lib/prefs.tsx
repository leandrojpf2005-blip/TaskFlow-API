/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { WeightUnit, LengthUnit } from "./units";
import type { Loggable } from "../types/loggable";

// Per-device preferences plus the user's favourite foods and saved recipes.
// Favourites live on the device until the backend grows a favourites table
// (see the backend ticket list) — they are a convenience, not records.

export interface Prefs {
  weightUnit: WeightUnit;
  lengthUnit: LengthUnit;
  weeklyWorkoutGoal: number;
  restSeconds: number;
}

const DEFAULT_PREFS: Prefs = {
  weightUnit: "kg",
  lengthUnit: "cm",
  weeklyWorkoutGoal: 4,
  restSeconds: 90,
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked — preference just won't persist */
  }
}

interface PrefsValue {
  prefs: Prefs;
  setPrefs: (patch: Partial<Prefs>) => void;
  favorites: Loggable[];
  isFavorite: (key: string) => boolean;
  toggleFavorite: (item: Loggable) => boolean;
  savedRecipes: number[];
  toggleSavedRecipe: (id: number) => void;
}

const Ctx = createContext<PrefsValue | null>(null);

export function PrefsProvider({ userId, children }: { userId: number; children: ReactNode }) {
  const favKey = `uplift_favorites_${userId}`;
  const savedKey = `uplift_saved_recipes_${userId}`;

  const [prefs, setPrefsState] = useState<Prefs>(() => read("uplift_prefs", DEFAULT_PREFS));
  const [favorites, setFavorites] = useState<Loggable[]>(() => readList(favKey));
  const [savedRecipes, setSaved] = useState<number[]>(() => readList(savedKey));

  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch };
      write("uplift_prefs", next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(
    (item: Loggable) => {
      let added = false;
      setFavorites((prev) => {
        const exists = prev.some((f) => f.key === item.key);
        added = !exists;
        const next = exists ? prev.filter((f) => f.key !== item.key) : [item, ...prev];
        write(favKey, next);
        return next;
      });
      return added;
    },
    [favKey],
  );

  const toggleSavedRecipe = useCallback(
    (id: number) => {
      setSaved((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
        write(savedKey, next);
        return next;
      });
    },
    [savedKey],
  );

  const value = useMemo<PrefsValue>(
    () => ({
      prefs,
      setPrefs,
      favorites,
      isFavorite: (key) => favorites.some((f) => f.key === key),
      toggleFavorite,
      savedRecipes,
      toggleSavedRecipe,
    }),
    [prefs, setPrefs, favorites, toggleFavorite, savedRecipes, toggleSavedRecipe],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs(): PrefsValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePrefs must be used inside <PrefsProvider>");
  return v;
}
