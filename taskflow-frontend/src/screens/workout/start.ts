import * as api from "../../api/workouts";
import type { SessionInit } from "../../lib/session";
import type { Routine } from "../../types/workouts";

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
