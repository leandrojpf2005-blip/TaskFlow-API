// Anything that can be logged to the diary: a catalogue food (macros per
// 100 g), a past diary entry or a recipe serving (macros per serving).

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Loggable extends Macros {
  /** Stable identity, used for favourites: "food:12" or "name:banana". */
  key: string;
  name: string;
  /** What the macros above are measured per. */
  basis: "per100g" | "serving";
  foodId?: number;
  /** Secondary line under the name, e.g. a brand or "100 g". */
  detail?: string;
}

export const ZERO_MACROS: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export function scaleMacros(m: Macros, factor: number): Macros {
  return {
    calories: m.calories * factor,
    protein: m.protein * factor,
    carbs: m.carbs * factor,
    fat: m.fat * factor,
  };
}

export const nameKey = (name: string) => `name:${name.trim().toLowerCase()}`;

/** A catalogue food (macros per 100 g) as something loggable. */
export function foodToLoggable(food: {
  id: number;
  name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}): Loggable {
  return {
    key: `food:${food.id}`,
    name: food.name,
    basis: "per100g",
    foodId: food.id,
    calories: Number(food.calories ?? 0),
    protein: Number(food.protein_g ?? 0),
    carbs: Number(food.carbs_g ?? 0),
    fat: Number(food.fat_g ?? 0),
  };
}
