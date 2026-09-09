// Workouts / routines / exercises API — wired to the FastAPI backend.
//   GET  /routines            -> Routine[]
//   GET  /routines/{id}       -> RoutineExercise[]
//   GET  /exercises?q=        -> Exercise[]
//   GET  /workouts            -> WorkoutSummary[]
//   GET  /workouts/{id}       -> WorkoutDetail (sets + volume)
//   POST /workouts            -> { id }
//   DELETE /workouts/{id}     -> { deleted }

import { request } from "./client";
import type {
  Exercise,
  Routine,
  RoutineExercise,
  WorkoutSummary,
  WorkoutDetail,
  NewWorkout,
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
