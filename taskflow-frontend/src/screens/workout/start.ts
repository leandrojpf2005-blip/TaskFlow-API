import * as api from "../../api/workouts";
import type { Session, SessionInit } from "../../lib/session";
import type { NewRoutine, Routine } from "../../types/workouts";

// Turning a routine or a past workout into the starting point of a session.

export async function routineToSession(routine: Routine): Promise<SessionInit> {
  const exs = await api.getRoutineExercises(routine.id);
  return {
    routineId: routine.id,
    name: routine.name,
    exercises: exs.map((e) => ({
      exerciseId: e.exercise_id,
      name: e.name,
      plannedSets: e.sets,
      sets: Array.from({ length: Math.max(1, e.sets) }, () => ({ reps: 10, weight: 20 })),
    })),
  };
}

export async function workoutToSession(id: number, name: string, routineId: number | null): Promise<SessionInit> {
  const detail = await api.getWorkout(id);
  // Group the old session's sets back into per-exercise blocks, in the order
  // they were logged, keeping last time's numbers as today's starting point.
  const blocks = new Map<number, SessionInit["exercises"][number]>();
  for (const st of [...detail.sets].sort((a, b) => a.id - b.id)) {
    let b = blocks.get(st.exercise_id);
    if (!b) {
      b = { exerciseId: st.exercise_id, name: st.name ?? "—", sets: [] };
      blocks.set(st.exercise_id, b);
    }
    b.sets.push({ reps: st.reps, weight: Number(st.weight) });
  }
  return { routineId, name, exercises: [...blocks.values()] };
}

/**
 * For a session started from a routine: the routine as this workout left it
 * (exercises, order and set counts), or null when nothing changed — the
 * "update the routine?" offer at the end of a workout.
 */
export async function routineChanges(session: Session): Promise<{ routine: Routine; body: NewRoutine } | null> {
  if (session.routineId === null || session.exercises.length === 0) return null;
  const [routines, current] = await Promise.all([api.getRoutines(), api.getRoutineExercises(session.routineId)]);
  const routine = routines.find((r) => r.id === session.routineId);
  if (!routine) return null; // deleted while training
  const items = session.exercises.map((e) => ({ exercise_id: e.exerciseId, sets: e.sets.length }));
  const shape = (xs: { exercise_id: number; sets: number }[]) => xs.map((x) => `${x.exercise_id}x${x.sets}`).join(",");
  if (shape(items) === shape(current)) return null;
  return { routine, body: { name: routine.name, items, folder_id: routine.folder_id ?? null } };
}
