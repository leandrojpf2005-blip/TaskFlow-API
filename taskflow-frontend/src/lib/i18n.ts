// Tiny in-house i18n. No dependency, and because every dictionary is typed
// against the English one, a missing or misspelt key fails the build instead of
// rendering blank at runtime.
//
// Adding a string: add it to EN, then TypeScript will point at the three
// dictionaries that still need it.

export const LANGS = [
  { key: "en", label: "English", flag: "🇬🇧" },
  { key: "pt", label: "Português", flag: "🇵🇹" },
  { key: "es", label: "Español", flag: "🇪🇸" },
  { key: "fr", label: "Français", flag: "🇫🇷" },
] as const;

export type Lang = (typeof LANGS)[number]["key"];

const en = {
  // tab bar
  "tab.workout": "Workout",
  "tab.home": "Home",
  "tab.log": "Log",
  "tab.progress": "Progress",
  "tab.more": "More",

  // shared
  "common.loading": "Loading…",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.saving": "Saving…",
  "common.today": "Today",
  "common.yesterday": "Yesterday",
  "common.starting": "Starting…",
  "common.somethingWrong": "Something went wrong",

  // workout tab
  "workout.title": "Workout",
  "workout.subtitle": "Keep the streak going",
  "workout.tab.today": "Today",
  "workout.tab.routines": "Routines",
  "workout.tab.history": "History",
  "workout.thisWeek": "This week",
  "workout.weekCount": "{done} / {goal} workouts",
  "workout.ready": "Ready to train?",
  "workout.readyHint": "Start an empty workout or pick a routine.",
  "workout.start": "Start workout",
  "workout.startRoutine": "Start from a routine",
  "workout.last": "Last workout",
  "workout.done": "Done",
  "workout.repeat": "Repeat this workout",
  "workout.noRoutines": "No routines yet.",
  "workout.noHistory": "No workouts logged yet.",
  "workout.free": "Free workout",
  "workout.exercises": "exercises",
  "workout.sets": "sets",
  "workout.volume": "volume",

  // active session
  "session.active": "Active",
  "session.empty": "Empty workout. Add an exercise to begin.",
  "session.lastTime": "Last time",
  "session.set": "Set",
  "session.kg": "Kg",
  "session.reps": "Reps",
  "session.addSet": "Add set",
  "session.addExercise": "Add exercise",
  "session.finish": "Finish workout",
  "session.needOneSet": "Complete at least one set (tap ✓).",
  "session.rest": "Rest timer",
  "session.skip": "Skip",
  "session.saveFailed": "Failed to save workout",

  // progress tab
  "progress.title": "Progress",
  "progress.noWeighIns": "No weigh-ins yet — log your first one below.",
  "progress.sinceStart": "since you started",
  "progress.logWeight": "Log weight",
  "progress.weight": "Weight",
  "progress.note": "Note",
  "progress.optional": "optional",
  "progress.recent": "Recent",
  "progress.enterWeight": "Enter a weight in kg.",
  "progress.saveFailed": "Could not save that weigh-in.",
  "progress.loadFailed": "Could not load your measurements.",

  // home tab
  "home.greeting": "Good to see you",
  "home.dailyCalories": "Daily calories",
  "home.remaining": "Remaining",
  "home.kcalLeft": "kcal left",
  "home.over": "over",
  "home.eaten": "Eaten",
  "home.goal": "Daily goal",
  "home.macros": "Macros",
  "home.protein": "Protein",
  "home.carbs": "Carbs",
  "home.fat": "Fat",
  "home.left": "{n}g left",
  "home.meals": "Meals",
  "home.addFood": "Add food",
  "home.noMeals": "No meals set up yet.",
  "home.water": "Water",
  "home.setGoal": "Set a goal to see your targets.",

  // more / settings
  "more.title": "More",
  "more.language": "Language",
  "more.theme": "Theme",
  "more.logout": "Log out",
} as const;

export type Key = keyof typeof en;
type Dict = Record<Key, string>;

const pt: Dict = {
  "tab.workout": "Treino",
  "tab.home": "Início",
  "tab.log": "Registar",
  "tab.progress": "Progresso",
  "tab.more": "Mais",

  "common.loading": "A carregar…",
  "common.cancel": "Cancelar",
  "common.save": "Guardar",
  "common.saving": "A guardar…",
  "common.today": "Hoje",
  "common.yesterday": "Ontem",
  "common.starting": "A começar…",
  "common.somethingWrong": "Algo correu mal",

  "workout.title": "Treino",
  "workout.subtitle": "Mantém o ritmo",
  "workout.tab.today": "Hoje",
  "workout.tab.routines": "Rotinas",
  "workout.tab.history": "Histórico",
  "workout.thisWeek": "Esta semana",
  "workout.weekCount": "{done} / {goal} treinos",
  "workout.ready": "Pronto para treinar?",
  "workout.readyHint": "Começa um treino ou escolhe uma rotina.",
  "workout.start": "Começar treino",
  "workout.startRoutine": "Começar a partir de uma rotina",
  "workout.last": "Último treino",
  "workout.done": "Feito",
  "workout.repeat": "Repetir este treino",
  "workout.noRoutines": "Ainda não tens rotinas.",
  "workout.noHistory": "Ainda não registaste treinos.",
  "workout.free": "Treino livre",
  "workout.exercises": "exercícios",
  "workout.sets": "séries",
  "workout.volume": "volume",

  "session.active": "Ativo",
  "session.empty": "Treino vazio. Adiciona um exercício para começar.",
  "session.lastTime": "Da última vez",
  "session.set": "Série",
  "session.kg": "Kg",
  "session.reps": "Reps",
  "session.addSet": "Adicionar série",
  "session.addExercise": "Adicionar exercício",
  "session.finish": "Terminar treino",
  "session.needOneSet": "Completa pelo menos uma série (toca em ✓).",
  "session.rest": "Descanso",
  "session.skip": "Saltar",
  "session.saveFailed": "Não foi possível guardar o treino",

  "progress.title": "Progresso",
  "progress.noWeighIns": "Ainda sem pesagens — regista a primeira abaixo.",
  "progress.sinceStart": "desde o início",
  "progress.logWeight": "Registar peso",
  "progress.weight": "Peso",
  "progress.note": "Nota",
  "progress.optional": "opcional",
  "progress.recent": "Registos recentes",
  "progress.enterWeight": "Indica um peso em kg.",
  "progress.saveFailed": "Não foi possível guardar a pesagem.",
  "progress.loadFailed": "Não foi possível carregar as tuas medições.",

  "home.greeting": "Que bom ver-te",
  "home.dailyCalories": "Calorias diárias",
  "home.remaining": "Restantes",
  "home.kcalLeft": "kcal restantes",
  "home.over": "a mais",
  "home.eaten": "Consumidas",
  "home.goal": "Objetivo diário",
  "home.macros": "Macros",
  "home.protein": "Proteína",
  "home.carbs": "Hidratos",
  "home.fat": "Gordura",
  "home.left": "faltam {n}g",
  "home.meals": "Refeições",
  "home.addFood": "Adicionar alimento",
  "home.noMeals": "Ainda não tens refeições definidas.",
  "home.water": "Água",
  "home.setGoal": "Define um objetivo para veres as tuas metas.",

  "more.title": "Mais",
  "more.language": "Idioma",
  "more.theme": "Tema",
  "more.logout": "Terminar sessão",
};

const es: Dict = {
  "tab.workout": "Entreno",
  "tab.home": "Inicio",
  "tab.log": "Registrar",
  "tab.progress": "Progreso",
  "tab.more": "Más",

  "common.loading": "Cargando…",
  "common.cancel": "Cancelar",
  "common.save": "Guardar",
  "common.saving": "Guardando…",
  "common.today": "Hoy",
  "common.yesterday": "Ayer",
  "common.starting": "Empezando…",
  "common.somethingWrong": "Algo salió mal",

  "workout.title": "Entreno",
  "workout.subtitle": "Mantén el ritmo",
  "workout.tab.today": "Hoy",
  "workout.tab.routines": "Rutinas",
  "workout.tab.history": "Historial",
  "workout.thisWeek": "Esta semana",
  "workout.weekCount": "{done} / {goal} entrenos",
  "workout.ready": "¿Listo para entrenar?",
  "workout.readyHint": "Empieza un entreno o elige una rutina.",
  "workout.start": "Empezar entreno",
  "workout.startRoutine": "Empezar desde una rutina",
  "workout.last": "Último entreno",
  "workout.done": "Hecho",
  "workout.repeat": "Repetir este entreno",
  "workout.noRoutines": "Aún no tienes rutinas.",
  "workout.noHistory": "Aún no has registrado entrenos.",
  "workout.free": "Entreno libre",
  "workout.exercises": "ejercicios",
  "workout.sets": "series",
  "workout.volume": "volumen",

  "session.active": "Activo",
  "session.empty": "Entreno vacío. Añade un ejercicio para empezar.",
  "session.lastTime": "La última vez",
  "session.set": "Serie",
  "session.kg": "Kg",
  "session.reps": "Reps",
  "session.addSet": "Añadir serie",
  "session.addExercise": "Añadir ejercicio",
  "session.finish": "Terminar entreno",
  "session.needOneSet": "Completa al menos una serie (toca ✓).",
  "session.rest": "Descanso",
  "session.skip": "Saltar",
  "session.saveFailed": "No se pudo guardar el entreno",

  "progress.title": "Progreso",
  "progress.noWeighIns": "Aún sin pesajes — registra el primero abajo.",
  "progress.sinceStart": "desde el inicio",
  "progress.logWeight": "Registrar peso",
  "progress.weight": "Peso",
  "progress.note": "Nota",
  "progress.optional": "opcional",
  "progress.recent": "Registros recientes",
  "progress.enterWeight": "Introduce un peso en kg.",
  "progress.saveFailed": "No se pudo guardar el pesaje.",
  "progress.loadFailed": "No se pudieron cargar tus medidas.",

  "home.greeting": "Me alegro de verte",
  "home.dailyCalories": "Calorías diarias",
  "home.remaining": "Restantes",
  "home.kcalLeft": "kcal restantes",
  "home.over": "de más",
  "home.eaten": "Consumidas",
  "home.goal": "Objetivo diario",
  "home.macros": "Macros",
  "home.protein": "Proteína",
  "home.carbs": "Carbohidratos",
  "home.fat": "Grasa",
  "home.left": "faltan {n}g",
  "home.meals": "Comidas",
  "home.addFood": "Añadir alimento",
  "home.noMeals": "Aún no tienes comidas configuradas.",
  "home.water": "Agua",
  "home.setGoal": "Define un objetivo para ver tus metas.",

  "more.title": "Más",
  "more.language": "Idioma",
  "more.theme": "Tema",
  "more.logout": "Cerrar sesión",
};

const fr: Dict = {
  "tab.workout": "Séance",
  "tab.home": "Accueil",
  "tab.log": "Ajouter",
  "tab.progress": "Progrès",
  "tab.more": "Plus",

  "common.loading": "Chargement…",
  "common.cancel": "Annuler",
  "common.save": "Enregistrer",
  "common.saving": "Enregistrement…",
  "common.today": "Aujourd'hui",
  "common.yesterday": "Hier",
  "common.starting": "Démarrage…",
  "common.somethingWrong": "Une erreur est survenue",

  "workout.title": "Séance",
  "workout.subtitle": "Garde le rythme",
  "workout.tab.today": "Aujourd'hui",
  "workout.tab.routines": "Routines",
  "workout.tab.history": "Historique",
  "workout.thisWeek": "Cette semaine",
  "workout.weekCount": "{done} / {goal} séances",
  "workout.ready": "Prêt à t'entraîner ?",
  "workout.readyHint": "Commence une séance ou choisis une routine.",
  "workout.start": "Commencer la séance",
  "workout.startRoutine": "Commencer depuis une routine",
  "workout.last": "Dernière séance",
  "workout.done": "Terminée",
  "workout.repeat": "Refaire cette séance",
  "workout.noRoutines": "Pas encore de routines.",
  "workout.noHistory": "Aucune séance enregistrée.",
  "workout.free": "Séance libre",
  "workout.exercises": "exercices",
  "workout.sets": "séries",
  "workout.volume": "volume",

  "session.active": "En cours",
  "session.empty": "Séance vide. Ajoute un exercice pour commencer.",
  "session.lastTime": "La dernière fois",
  "session.set": "Série",
  "session.kg": "Kg",
  "session.reps": "Reps",
  "session.addSet": "Ajouter une série",
  "session.addExercise": "Ajouter un exercice",
  "session.finish": "Terminer la séance",
  "session.needOneSet": "Valide au moins une série (touche ✓).",
  "session.rest": "Récupération",
  "session.skip": "Passer",
  "session.saveFailed": "Impossible d'enregistrer la séance",

  "progress.title": "Progrès",
  "progress.noWeighIns": "Aucune pesée — enregistre la première ci-dessous.",
  "progress.sinceStart": "depuis le début",
  "progress.logWeight": "Enregistrer le poids",
  "progress.weight": "Poids",
  "progress.note": "Note",
  "progress.optional": "facultatif",
  "progress.recent": "Pesées récentes",
  "progress.enterWeight": "Indique un poids en kg.",
  "progress.saveFailed": "Impossible d'enregistrer cette pesée.",
  "progress.loadFailed": "Impossible de charger tes mesures.",

  "home.greeting": "Content de te voir",
  "home.dailyCalories": "Calories du jour",
  "home.remaining": "Restantes",
  "home.kcalLeft": "kcal restantes",
  "home.over": "en trop",
  "home.eaten": "Consommées",
  "home.goal": "Objectif du jour",
  "home.macros": "Macros",
  "home.protein": "Protéines",
  "home.carbs": "Glucides",
  "home.fat": "Lipides",
  "home.left": "{n}g restants",
  "home.meals": "Repas",
  "home.addFood": "Ajouter un aliment",
  "home.noMeals": "Aucun repas configuré.",
  "home.water": "Eau",
  "home.setGoal": "Définis un objectif pour voir tes cibles.",

  "more.title": "Plus",
  "more.language": "Langue",
  "more.theme": "Thème",
  "more.logout": "Se déconnecter",
};

const DICTS: Record<Lang, Dict> = { en, pt, es, fr };

const STORAGE_KEY = "uplift_lang";

/** Saved choice, else the browser's language if we speak it, else English. */
export function getSavedLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in DICTS) return saved as Lang;
  } catch {
    /* storage blocked */
  }
  const nav = navigator.language?.slice(0, 2);
  return nav && nav in DICTS ? (nav as Lang) : "en";
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* storage blocked */
  }
  document.documentElement.lang = lang;
}

export type Translate = (key: Key, vars?: Record<string, string | number>) => string;

/** Build the translate function for a language. `{name}` placeholders are filled from vars. */
export function translator(lang: Lang): Translate {
  const dict = DICTS[lang];
  return (key, vars) => {
    let out: string = dict[key] ?? en[key];
    if (vars) {
      for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
    }
    return out;
  };
}
