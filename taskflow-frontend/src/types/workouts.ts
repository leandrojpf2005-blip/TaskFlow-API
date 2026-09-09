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

// GET /routines/{id} — names + set counts (no exercise_id).
export interface RoutineExercise {
  name: string;
  sets: number;
}

export interface WorkoutSummary {
  id: number;
  routine_id: number | null;
  date: string; // ISO datetime
  duration: number | null; // seconds
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

export interface NewWorkout {
  routine_id?: number | null;
  date?: string | null;
  duration?: number | null;
  sets: NewWorkoutSet[];
}
