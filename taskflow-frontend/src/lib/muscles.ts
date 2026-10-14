import type { Lang } from "./i18n";

// Muscle names as stored by the exercise catalogue (free-exercise-db), shown
// in the UI language. Unknown names fall back to the stored text.

const NAMES: Record<string, Record<Lang, string>> = {
  abdominals: { en: "Abs", pt: "Abdominais", es: "Abdominales", fr: "Abdominaux" },
  abductors: { en: "Abductors", pt: "Abdutores", es: "Abductores", fr: "Abducteurs" },
  adductors: { en: "Adductors", pt: "Adutores", es: "Aductores", fr: "Adducteurs" },
  biceps: { en: "Biceps", pt: "Bíceps", es: "Bíceps", fr: "Biceps" },
  calves: { en: "Calves", pt: "Gémeos", es: "Gemelos", fr: "Mollets" },
  chest: { en: "Chest", pt: "Peito", es: "Pecho", fr: "Pectoraux" },
  forearms: { en: "Forearms", pt: "Antebraços", es: "Antebrazos", fr: "Avant-bras" },
  glutes: { en: "Glutes", pt: "Glúteos", es: "Glúteos", fr: "Fessiers" },
  hamstrings: { en: "Hamstrings", pt: "Isquiotibiais", es: "Isquiotibiales", fr: "Ischio-jambiers" },
  lats: { en: "Lats", pt: "Dorsais", es: "Dorsales", fr: "Dorsaux" },
  "lower back": { en: "Lower back", pt: "Lombar", es: "Zona lumbar", fr: "Lombaires" },
  "middle back": { en: "Middle back", pt: "Meio das costas", es: "Espalda media", fr: "Milieu du dos" },
  neck: { en: "Neck", pt: "Pescoço", es: "Cuello", fr: "Cou" },
  quadriceps: { en: "Quads", pt: "Quadríceps", es: "Cuádriceps", fr: "Quadriceps" },
  shoulders: { en: "Shoulders", pt: "Ombros", es: "Hombros", fr: "Épaules" },
  traps: { en: "Traps", pt: "Trapézio", es: "Trapecio", fr: "Trapèzes" },
  triceps: { en: "Triceps", pt: "Tríceps", es: "Tríceps", fr: "Triceps" },
};

export function muscleLabel(name: string, lang: Lang): string {
  return NAMES[name.trim().toLowerCase()]?.[lang] ?? name;
}
