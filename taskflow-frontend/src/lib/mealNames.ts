import type { Lang } from "./i18n";

// Meals are user data (their names live in the database), but most accounts
// still carry the English defaults seeded at onboarding. Those defaults are
// shown in the UI language; anything the user renamed is shown as typed.

const DEFAULTS: Record<string, Record<Lang, string>> = {
  breakfast: { en: "Breakfast", pt: "Pequeno-almoço", es: "Desayuno", fr: "Petit-déjeuner" },
  lunch: { en: "Lunch", pt: "Almoço", es: "Almuerzo", fr: "Déjeuner" },
  dinner: { en: "Dinner", pt: "Jantar", es: "Cena", fr: "Dîner" },
  snacks: { en: "Snacks", pt: "Snacks", es: "Snacks", fr: "Collations" },
  snack: { en: "Snack", pt: "Snack", es: "Snack", fr: "Collation" },
  "afternoon snack": { en: "Afternoon snack", pt: "Lanche", es: "Merienda", fr: "Goûter" },
  "morning snack": { en: "Morning snack", pt: "Lanche da manhã", es: "Media mañana", fr: "Collation du matin" },
  supper: { en: "Supper", pt: "Ceia", es: "Recena", fr: "Souper" },
};

export function mealLabel(name: string, lang: Lang): string {
  return DEFAULTS[name.trim().toLowerCase()]?.[lang] ?? name;
}

/** Default meal names seeded for a new account, in the UI language. */
export function defaultMealNames(lang: Lang): string[] {
  return ["breakfast", "lunch", "dinner", "snacks"].map((k) => DEFAULTS[k][lang]);
}
