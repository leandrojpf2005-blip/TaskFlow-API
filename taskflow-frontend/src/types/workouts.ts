// Mirrors the backend workout/routine/exercise schemas.

export interface Exercise {
  id: number;
  name: string;
  primary_muscles: string[];
  secondary_muscles?: string[] | null;
  instructions?: string[] | null;
  images?: string[] | null;
}

export interface Routine {
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
