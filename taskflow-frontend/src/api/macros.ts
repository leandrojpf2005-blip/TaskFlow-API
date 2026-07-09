// API layer for the macro diary.
//
// These are NAMED STUBS ONLY — the UI currently runs on mock data (see
// src/data/mockData.ts and the local state in App.tsx). Wire each function to
// the backend that already works, then swap App.tsx's local mutations for
// these calls.
//
// Backend endpoints (all tested and working except PATCH, which is in progress):
//   GET    /macros?entry_date=YYYY-MM-DD   -> FoodEntry[]
//   POST   /macros                          -> FoodEntry
//   PATCH  /macros/{id}                     -> FoodEntry   (being built)
//   DELETE /macros/{id}                     -> { message }

import type { FoodEntry, NewFoodEntry, UpdateFoodEntry } from "../types/macros";

// GET /macros?entry_date=<date>
export async function getDay(_date: string): Promise<FoodEntry[]> {
  // TODO: return request<FoodEntry[]>(`/macros?entry_date=${_date}`);
  throw new Error("getDay: not wired to backend yet");
}

// POST /macros
export async function createFoodEntry(_entry: NewFoodEntry): Promise<FoodEntry> {
  // TODO: return request<FoodEntry>("/macros", { method: "POST", body: JSON.stringify(_entry) });
  throw new Error("createFoodEntry: not wired to backend yet");
}

// PATCH /macros/{id}
export async function updateFoodEntry(
  _id: number,
  _changes: UpdateFoodEntry,
): Promise<FoodEntry> {
  // TODO: return request<FoodEntry>(`/macros/${_id}`, { method: "PATCH", body: JSON.stringify(_changes) });
  throw new Error("updateFoodEntry: not wired to backend yet");
}

// DELETE /macros/{id}
export async function deleteFoodEntry(_id: number): Promise<void> {
  // TODO: await request(`/macros/${_id}`, { method: "DELETE" });
  throw new Error("deleteFoodEntry: not wired to backend yet");
}
