// Mock data so the UI renders as a complete, realistic screen while the API
// layer (src/api/macros.ts) is still stubbed. Replace with real fetches later.

import type { FoodEntry, Meal, MacroTargets } from "../types/macros";
import { todayISO } from "../lib/date";

export const MEALS: Meal[] = [
  { id: 1, name: "Breakfast", position: 1 },
  { id: 2, name: "Lunch", position: 2 },
  { id: 3, name: "Snack", position: 3 },
  { id: 4, name: "Dinner", position: 4 },
];

// The coach-set daily targets for this client.
export const TARGETS: MacroTargets = {
  calories: 2200,
  protein: 165,
  carbs: 220,
  fat: 70,
};

const TODAY = todayISO();

export const MOCK_ENTRIES: FoodEntry[] = [
  {
    id: 1,
    date: TODAY,
    meal_id: 1,
    meal_name: "Breakfast",
    food_name: "Oats with whey & banana",
    calories: 430,
    protein: 34,
    carbs: 58,
    fat: 8,
  },
  {
    id: 2,
    date: TODAY,
    meal_id: 1,
    meal_name: "Breakfast",
    food_name: "Black coffee",
    calories: 5,
    protein: 0,
    carbs: 1,
    fat: 0,
  },
  {
    id: 3,
    date: TODAY,
    meal_id: 2,
    meal_name: "Lunch",
    food_name: "Chicken, rice & greens",
    calories: 620,
    protein: 52,
    carbs: 68,
    fat: 14,
  },
  {
    id: 4,
    date: TODAY,
    meal_id: 3,
    meal_name: "Snack",
    food_name: "Greek yogurt & berries",
    calories: 180,
    protein: 18,
    carbs: 20,
    fat: 3,
  },
];
