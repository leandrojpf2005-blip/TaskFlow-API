// Workouts / routines / exercises API — wired to the FastAPI backend.
//   GET  /routines            -> Routine[]
//   GET  /routines/{id}       -> RoutineExercise[]
//   GET  /exercises?q=        -> Exercise[]
//   GET  /workouts            -> WorkoutSummary[]
//   GET  /workouts/{id}       -> WorkoutDetail (sets + volume)
//   POST /workouts            -> { id }
//   DELETE /workouts/{id}     -> { deleted }
//   GET  /workouts/last-performance?exercise_ids=1&exercise_ids=2
//                             -> { "1": LastPerformance, ... }

import { request } from "./client";
import type {
  Exercise,
  Routine,
  RoutineExercise,
  WorkoutSummary,
  WorkoutDetail,
  NewWorkout,
  LastPerformanceMap,
} from "../types/workouts";

export const getRoutines = () => request<Routine[]>("/routines");

export const getRoutineExercises = (id: number) => request<RoutineExercise[]>(`/routines/${id}`);

export const getExercises = (q?: string) =>
  request<Exercise[]>(`/exercises${q ? `?q=${encodeURIComponent(q)}` : ""}`);

export const getWorkouts = () => request<WorkoutSummary[]>("/workouts");

export const getWorkout = (id: number) => request<WorkoutDetail>(`/workouts/${id}`);

export const createWorkout = (w: NewWorkout) =>
  request<{ id: number }>("/workouts", { method: "POST", body: JSON.stringify(w) });

export const deleteWorkout = (id: number) =>
  request<{ deleted: number }>(`/workouts/${id}`, { method: "DELETE" });

// Last performance for a set of exercises, in one request rather than one per
// exercise. Repeated query params are how FastAPI reads a list[int].
export const getLastPerformance = (exerciseIds: number[]) => {
  if (exerciseIds.length === 0) return Promise.resolve({} as LastPerformanceMap);
  const qs = exerciseIds.map((id) => `exercise_ids=${id}`).join("&");
  return request<LastPerformanceMap>(`/workouts/last-performance?${qs}`);
};
