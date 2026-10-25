import { getDay } from "../api/macros";
import { addDays, todayIso } from "./dates";
import { nameKey, type Loggable } from "../types/loggable";
import type { FoodEntry } from "../types/macros";

// Recent foods, derived from the last two weeks of diary entries until the
// backend has a recents endpoint (a GROUP BY over food_log_entry — ticketed).
// Each distinct food name keeps its most recent portion; "count" drives the
// "Frequent" tag.

export interface RecentFood extends Loggable {
  count: number;
  lastDate: string;
}

const WINDOW_DAYS = 14;
let cache: { version: number; promise: Promise<RecentFood[]> } | null = null;

export function loadRecents(diaryVersion: number): Promise<RecentFood[]> {
  if (cache && cache.version === diaryVersion) return cache.promise;
  const promise = build().catch(() => [] as RecentFood[]);
  cache = { version: diaryVersion, promise };
  return promise;
}

async function build(): Promise<RecentFood[]> {
  const today = todayIso();
  const days = Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(today, -i));
  const results = await Promise.all(days.map((d) => getDay(d).catch(() => [] as FoodEntry[])));

  const byName = new Map<string, RecentFood>();
  // Newest day first, so the first time we see a name is its latest portion.
  results.forEach((entries) => {
    for (const e of [...entries].reverse()) {
      const key = nameKey(e.food_name);
      const seen = byName.get(key);
      if (seen) {
        seen.count += 1;
        continue;
      }
      byName.set(key, {
        key,
        name: e.food_name,
        basis: "serving",
        calories: e.calories ?? 0,
        protein: Number(e.protein ?? 0),
        carbs: Number(e.carbs ?? 0),
        fat: Number(e.fat ?? 0),
        count: 1,
        lastDate: e.date,
      });
    }
  });
  return [...byName.values()];
}
