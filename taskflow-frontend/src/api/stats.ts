// Streak — days in a row with something logged. Backend ticket (the
// gaps-and-islands query); until it ships this 404s and the flame chip hides.
//   GET /stats/streak -> { current: number, best: number }

import { request } from "./client";

export interface Streak {
  current: number;
  best: number;
}

export async function getStreak(): Promise<Streak | null> {
  try {
    return await request<Streak>("/stats/streak");
  } catch {
    return null;
  }
}
