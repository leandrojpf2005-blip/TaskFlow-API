// Food-log API — wired to the FastAPI backend.
//   GET    /macros?entry_date=YYYY-MM-DD
//   POST   /macros
//   PATCH  /macros/{id}
//   DELETE /macros/{id}

import { request } from "./client";
import type { FoodEntry, NewFoodEntry, UpdateFoodEntry } from "../types/macros";

export function getDay(date: string): Promise<FoodEntry[]> {
  return request<FoodEntry[]>(`/macros?entry_date=${date}`);
}

export function createFoodEntry(entry: NewFoodEntry): Promise<FoodEntry> {
  return request<FoodEntry>("/macros", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

export function updateFoodEntry(id: number, changes: UpdateFoodEntry): Promise<FoodEntry> {
  return request<FoodEntry>(`/macros/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

export function deleteFoodEntry(id: number): Promise<void> {
  return request<void>(`/macros/${id}`, { method: "DELETE" });
}
