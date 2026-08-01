// Meal API — wired to the FastAPI backend.
//   GET    /meals
//   POST   /meals
//   PATCH  /meals/{id}
//   DELETE /meals/{id}

import { request } from "./client";
import type { Meal } from "../types/macros";

export interface NewMeal {
  name: string;
  position: number;
  target_calories: number | null;
}

export interface UpdateMeal {
  name?: string;
  position?: number;
  target_calories?: number | null;
}

export function getMeals(): Promise<Meal[]> {
  return request<Meal[]>("/meals");
}

export function createMeal(meal: NewMeal): Promise<Meal> {
  return request<Meal>("/meals", {
    method: "POST",
    body: JSON.stringify(meal),
  });
}

export function updateMeal(id: number, changes: UpdateMeal): Promise<Meal> {
  return request<Meal>(`/meals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

export function deleteMeal(id: number): Promise<void> {
  return request<void>(`/meals/${id}`, { method: "DELETE" });
}
