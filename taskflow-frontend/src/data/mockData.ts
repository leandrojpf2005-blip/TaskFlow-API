// Placeholder daily targets. Meals and food entries now come from the backend;
// per-user macro targets aren't a backend feature yet, so these stay hardcoded
// until a targets endpoint exists.

import type { MacroTargets } from "../types/macros";

export const TARGETS: MacroTargets = {
  calories: 2200,
  protein: 165,
  carbs: 220,
  fat: 70,
};
