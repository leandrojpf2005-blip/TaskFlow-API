import { useEffect, useMemo, useState } from "react";
import { getExercises } from "../api/workouts";
import type { Exercise } from "../types/workouts";
import type { Lang } from "./i18n";
import { useLang } from "./langHooks";

// The exercise library (GET /exercises, ~200 rows) is fetched once per session
// and shared: the picker filters it locally, and every screen that shows an
// exercise looks its translated name up here by id.

let catalogue: Promise<Exercise[]> | null = null;
export function loadCatalogue(): Promise<Exercise[]> {
  if (!catalogue) {
    catalogue = getExercises().catch((e) => {
      catalogue = null; // let the next caller retry
      throw e;
    });
  }
  return catalogue;
}

export function exerciseLabel(ex: Pick<Exercise, "name" | "names">, lang: Lang): string {
  return ex.names?.[lang] ?? ex.name;
}

/**
 * Look exercises up by id: `get(id)` for the record (slug, equipment… for the
 * drawing), `name(id, fallback)` for its name in the UI language. Exercises
 * that left the library (old workout history) keep the name the API sent.
 */
export function useExercises() {
  const { lang } = useLang();
  const [byId, setById] = useState<Map<number, Exercise> | null>(null);

  useEffect(() => {
    let live = true;
    loadCatalogue()
      .then((list) => live && setById(new Map(list.map((ex) => [ex.id, ex]))))
      .catch(() => undefined); // names fall back to the API's English
    return () => {
      live = false;
    };
  }, []);

  return useMemo(
    () => ({
      get: (id: number) => byId?.get(id),
      name: (id: number, fallback: string) => {
        const ex = byId?.get(id);
        return ex ? exerciseLabel(ex, lang) : fallback;
      },
    }),
    [byId, lang],
  );
}

/** `exName(id, fallback)` — see useExercises. */
export function useExerciseName(): (id: number, fallback: string) => string {
  return useExercises().name;
}

/** Lower-case and strip accents, so "elevacao" finds "Elevação". */
export function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Display order of the picker's groups.
export const BODY_PARTS = ["chest", "back", "shoulders", "arms", "legs", "core", "olympic", "full_body", "cardio"];

const BODY_PART_NAMES: Record<string, Record<Lang, string>> = {
  chest: { en: "Chest", pt: "Peito", es: "Pecho", fr: "Pectoraux" },
  back: { en: "Back", pt: "Costas", es: "Espalda", fr: "Dos" },
  shoulders: { en: "Shoulders", pt: "Ombros", es: "Hombros", fr: "Épaules" },
  arms: { en: "Arms", pt: "Braços", es: "Brazos", fr: "Bras" },
  legs: { en: "Legs", pt: "Pernas", es: "Piernas", fr: "Jambes" },
  core: { en: "Core", pt: "Core", es: "Core", fr: "Abdos" },
  olympic: { en: "Olympic", pt: "Olímpicos", es: "Olímpicos", fr: "Haltérophilie" },
  full_body: { en: "Full body", pt: "Corpo inteiro", es: "Cuerpo completo", fr: "Corps entier" },
  cardio: { en: "Cardio", pt: "Cardio", es: "Cardio", fr: "Cardio" },
};

export const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "smith_machine",
  "ez_bar",
  "kettlebell",
  "trap_bar",
  "plate",
  "bodyweight",
  "cardio",
];

const EQUIPMENT_NAMES: Record<string, Record<Lang, string>> = {
  barbell: { en: "Barbell", pt: "Barra", es: "Barra", fr: "Barre" },
  dumbbell: { en: "Dumbbell", pt: "Halteres", es: "Mancuernas", fr: "Haltères" },
  machine: { en: "Machine", pt: "Máquina", es: "Máquina", fr: "Machine" },
  cable: { en: "Cable", pt: "Polia", es: "Polea", fr: "Poulie" },
  smith_machine: { en: "Smith machine", pt: "Smith", es: "Multipower", fr: "Smith" },
  ez_bar: { en: "EZ bar", pt: "Barra EZ", es: "Barra Z", fr: "Barre EZ" },
  kettlebell: { en: "Kettlebell", pt: "Kettlebell", es: "Kettlebell", fr: "Kettlebell" },
  trap_bar: { en: "Trap bar", pt: "Barra hexagonal", es: "Barra hexagonal", fr: "Trap bar" },
  plate: { en: "Plate", pt: "Disco", es: "Disco", fr: "Disque" },
  bodyweight: { en: "Bodyweight", pt: "Peso corporal", es: "Peso corporal", fr: "Poids du corps" },
  cardio: { en: "Cardio", pt: "Cardio", es: "Cardio", fr: "Cardio" },
};

export const bodyPartLabel = (part: string, lang: Lang) => BODY_PART_NAMES[part]?.[lang] ?? part;
export const equipmentLabel = (eq: string, lang: Lang) => EQUIPMENT_NAMES[eq]?.[lang] ?? eq;
