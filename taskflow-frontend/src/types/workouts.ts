// Mirrors the backend workout/routine/exercise schemas.

export interface Exercise {
  id: number;
  name: string;
  primary_muscles: string[];
  secondary_muscles?: string[] | null;
  instructions?: string[] | null;
  images?: string[] | null;
  slug?: string | null;
  names?: Partial<Record<"en" | "pt" | "es" | "fr", string>> | null;
  body_part?: string | null; // chest, back, shoulders, arms, legs, core, olympic, full_body, cardio
  equipment?: string | null;
  type?: string; // weight_reps, bodyweight_reps, assisted_bodyweight, weighted_bodyweight, duration, cardio
}

export interface Routine {
  id: number;
  name: string;
  folder_id?: number | null; // null/absent: not in a folder
}

// A folder ("space") that groups routines, e.g. Push / Pull / Legs.
export interface Folder {
  id: number;
  name: string;
}

// GET /routines/{id} — exercise_id, name and the planned set count.
export interface RoutineExercise {
  exercise_id: number;
  name: string;
  sets: number;
}

// GET /workouts — one row per session, with its totals rolled up in SQL.
export interface WorkoutSummary {
  id: number;
  routine_id: number | null;
  name: string | null; // routine name, null for a freestyle session
  date: string; // ISO datetime
  duration: number | null; // seconds
  volume: number;
  set_count: number;
  exercise_count: number;
}

export interface WorkoutSet {
  id: number;
  exercise_id: number;
  name: string | null;
  reps: number;
  weight: number;
  set_number: number;
}

export interface WorkoutDetail extends WorkoutSummary {
  sets: WorkoutSet[];
  volume: number;
}

export interface NewWorkoutSet {
  exercise_id: number;
  reps: number;
  weight: number;
  set_number: number;
}

export interface NewRoutine {
  name: string;
  items: { exercise_id: number; sets: number }[];
  folder_id?: number | null;
}

export interface NewWorkout {
  routine_id?: number | null;
  date?: string | null;
  duration?: number | null;
  sets: NewWorkoutSet[];
}

// GET /workouts/last-performance?exercise_ids=… — the sets logged the last time
// each exercise was trained, keyed by exercise id. JSON object keys are strings.
export interface LastSet {
  set_number: number;
  reps: number;
  weight: number;
}

export interface LastPerformance {
  exercise_id: number;
  date: string;
  sets: LastSet[];
}

export type LastPerformanceMap = Record<string, LastPerformance>;
