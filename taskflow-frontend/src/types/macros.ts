// Domain types for the macro diary. These mirror the backend schemas
// (app/macros/schemas/macro_schemas.py).

export interface Meal {
  id: number;
  name: string;
  position: number;
  target_calories: number | null;
}

export interface FoodEntry {
  id: number;
  date: string; // ISO date, e.g. "2026-07-08"
  meal_id: number;
  meal_name?: string; // only present on GET /macros (the JOIN); absent on POST/PATCH responses
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
