import { createFoodEntry } from "../api/macros";
import { scaleMacros, type Loggable, type Macros } from "../types/loggable";
import type { Meal } from "../types/macros";

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * The macros for an amount of something loggable. `amount` is grams for
 * catalogue foods (macros per 100 g) and a number of servings otherwise.
 */
export function macrosFor(item: Macros & { basis: Loggable["basis"] }, amount: number): Macros {
  return scaleMacros(item, item.basis === "per100g" ? amount / 100 : amount);
}

export async function logFood(item: Loggable, amount: number, mealId: number, date: string) {
  const m = macrosFor(item, amount);
  return createFoodEntry({
    meal_id: mealId,
    food_name: item.name,
    calories: Math.round(m.calories),
    protein: r1(m.protein),
    carbs: r1(m.carbs),
    fat: r1(m.fat),
    date,
    food_id: item.foodId ?? null,
    amount_g: item.basis === "per100g" ? r1(amount) : null,
  });
}

/** The meal that fits the time of day, so the Log flow opens on the right one. */
export function mealForNow(meals: Meal[]): Meal | undefined {
  if (meals.length === 0) return undefined;
  const h = new Date().getHours();
  const slot = h < 11 ? 0 : h < 15 ? 1 : h < 18 ? 2 : 3;
  return meals[Math.min(slot, meals.length - 1)];
}
