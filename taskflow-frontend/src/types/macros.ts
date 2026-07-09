// Domain types for the macro diary. These mirror the backend schemas
// (app/macros/schemas/macro_schemas.py) so the API layer can stay typed.

export interface Meal {
  id: number;
  name: string;
  position: number;
}

export interface FoodEntry {
  id: number;
  date: string; // ISO date, e.g. "2026-07-08"
  meal_id: number;
  meal_name: string; // comes from the JOIN on the backend
  food_name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface NewFoodEntry {
  meal_id: number;
  food_name: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  date?: string | null; // omit to default to today (backend fills CURRENT_DATE)
}

export interface UpdateFoodEntry {
  meal_id?: number;
  food_name?: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
