/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as workoutsApi from "../api/workouts";
import type { LastPerformanceMap, NewWorkoutSet } from "../types/workouts";

// The workout in progress. It lives above the screens so it survives
// minimising the session screen, switching tabs and — because it is mirrored
// to localStorage — a page refresh halfway through a gym session.
// Weights are always kept in kg here; screens convert for display.

export interface SSet {
  reps: number;
  weight: number;
  done: boolean;
  /** Edited by hand, so last-performance prefill must leave it alone. */
  touched?: boolean;
}

export interface SExercise {
  uid: string;
  exerciseId: number;
  name: string;
  plannedSets?: number;
  sets: SSet[];
}

export interface Session {
  routineId: number | null;
  name: string;
  startedAt: number;
  exercises: SExercise[];
  restEndsAt: number | null;
  restTotal: number;
}

export interface SessionInit {
  routineId: number | null;
  name: string;
  exercises: {
    exerciseId: number;
    name: string;
    plannedSets?: number;
    sets: { reps: number; weight: number }[];
  }[];
}

interface SessionValue {
  session: Session | null;
  start: (init: SessionInit) => void;
  rename: (name: string) => void;
  addExercise: (ex: { exerciseId: number; name: string }) => void;
  removeExercise: (uid: string) => void;
  /** Swap an exercise for another (machine taken). Sets already done stay with the old one. */
  replaceExercise: (uid: string, ex: { exerciseId: number; name: string }) => void;
  /** Move an exercise to another position (drag to reorder). */
  moveExercise: (from: number, to: number) => void;
  addSet: (uid: string) => void;
  removeSet: (uid: string) => void;
  /** Remove one particular set (swipe left). An exercise keeps at least one. */
  removeSetAt: (uid: string, index: number) => void;
  updateSet: (uid: string, index: number, patch: Partial<SSet>) => void;
  toggleSet: (uid: string, index: number, restSeconds: number) => void;
  startRest: (seconds: number) => void;
  stopRest: () => void;
  adjustRest: (deltaSeconds: number) => void;
  prefill: (map: LastPerformanceMap) => void;
  discard: () => void;
  finish: () => Promise<number>;
}

const Ctx = createContext<SessionValue | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);
const DEFAULT_SET: SSet = { reps: 10, weight: 20, done: false };

function load(key: string): Session | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function SessionProvider({ userId, children }: { userId: number; children: ReactNode }) {
  const storageKey = `uplift_session_${userId}`;
  const [session, setSession] = useState<Session | null>(() => load(storageKey));

  useEffect(() => {
    try {
      if (session) localStorage.setItem(storageKey, JSON.stringify(session));
      else localStorage.removeItem(storageKey);
    } catch {
      /* storage blocked — the session still works, it just won't survive a refresh */
    }
  }, [session, storageKey]);

  const mutate = useCallback((fn: (s: Session) => Session) => {
    setSession((s) => (s ? fn(s) : s));
  }, []);

  const mapExercise = useCallback(
    (id: string, fn: (ex: SExercise) => SExercise) =>
      mutate((s) => ({ ...s, exercises: s.exercises.map((ex) => (ex.uid === id ? fn(ex) : ex)) })),
    [mutate],
  );

  const start = useCallback((init: SessionInit) => {
    setSession({
      routineId: init.routineId,
      name: init.name,
      startedAt: Date.now(),
      restEndsAt: null,
      restTotal: 0,
      exercises: init.exercises.map((e) => ({
        uid: uid(),
        exerciseId: e.exerciseId,
        name: e.name,
        plannedSets: e.plannedSets,
        sets: (e.sets.length ? e.sets : [DEFAULT_SET]).map((s) => ({ ...s, done: false })),
      })),
    });
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      session,
      start,
      rename: (name) => mutate((s) => ({ ...s, name })),
      addExercise: (ex) =>
        mutate((s) => ({
          ...s,
          exercises: [
            ...s.exercises,
            { uid: uid(), exerciseId: ex.exerciseId, name: ex.name, sets: [{ ...DEFAULT_SET }] },
          ],
        })),
      removeExercise: (id) => mutate((s) => ({ ...s, exercises: s.exercises.filter((e) => e.uid !== id) })),
      replaceExercise: (id, next) =>
        mutate((s) => ({
          ...s,
          exercises: s.exercises.flatMap((cur) => {
            if (cur.uid !== id) return [cur];
            const done = cur.sets.filter((st) => st.done);
            const left = cur.sets.filter((st) => !st.done);
            // The sets still to do move over, untouched, so the new exercise's
            // last performance can fill them in.
            const swapped: SExercise = {
              uid: uid(),
              exerciseId: next.exerciseId,
              name: next.name,
              plannedSets: cur.plannedSets === undefined ? undefined : Math.max(1, left.length),
              sets: (left.length ? left : [DEFAULT_SET]).map((st) => ({ reps: st.reps, weight: st.weight, done: false })),
            };
            // Sets already done were done on the old exercise: they stay there.
            if (done.length === 0) return [swapped];
            const kept = { ...cur, sets: done, plannedSets: cur.plannedSets === undefined ? undefined : done.length };
            return [kept, swapped];
          }),
        })),
      addSet: (id) =>
        mapExercise(id, (ex) => {
          const last = ex.sets[ex.sets.length - 1] ?? DEFAULT_SET;
          return { ...ex, sets: [...ex.sets, { reps: last.reps, weight: last.weight, done: false }] };
        }),
      removeSet: (id) =>
        mapExercise(id, (ex) => (ex.sets.length > 1 ? { ...ex, sets: ex.sets.slice(0, -1) } : ex)),
      removeSetAt: (id, index) =>
        mapExercise(id, (ex) => (ex.sets.length > 1 ? { ...ex, sets: ex.sets.filter((_, i) => i !== index) } : ex)),
      moveExercise: (from, to) =>
        mutate((s) => {
          const exercises = [...s.exercises];
          const [moved] = exercises.splice(from, 1);
          if (!moved) return s;
          exercises.splice(to, 0, moved);
          return { ...s, exercises };
        }),
      updateSet: (id, index, patch) =>
        mapExercise(id, (ex) => ({
          ...ex,
          sets: ex.sets.map((st, i) => (i === index ? { ...st, ...patch } : st)),
        })),
      toggleSet: (id, index, restSeconds) =>
        mutate((s) => {
          let completed = false;
          const exercises = s.exercises.map((ex) => {
            if (ex.uid !== id) return ex;
            return {
              ...ex,
              sets: ex.sets.map((st, i) => {
                if (i !== index) return st;
                completed = !st.done;
                return { ...st, done: !st.done };
              }),
            };
          });
          // Finishing a set starts the rest clock, like Strong does.
          return completed && restSeconds > 0
            ? { ...s, exercises, restEndsAt: Date.now() + restSeconds * 1000, restTotal: restSeconds }
            : { ...s, exercises };
        }),
      startRest: (seconds) =>
        mutate((s) => ({ ...s, restEndsAt: Date.now() + seconds * 1000, restTotal: seconds })),
      stopRest: () => mutate((s) => ({ ...s, restEndsAt: null })),
      adjustRest: (delta) =>
        mutate((s) =>
          s.restEndsAt
            ? { ...s, restEndsAt: Math.max(Date.now(), s.restEndsAt + delta * 1000), restTotal: Math.max(0, s.restTotal + delta) }
            : s,
        ),
      prefill: (map) =>
        mutate((s) => ({
          ...s,
          exercises: s.exercises.map((ex) => {
            const was = map[String(ex.exerciseId)];
            if (!was) return ex;
            // Match the planned number of sets to last time when nothing is done yet.
            let sets = ex.sets;
            if (!sets.some((st) => st.done || st.touched) && was.sets.length > sets.length && !ex.plannedSets) {
              sets = [...sets, ...was.sets.slice(sets.length).map(() => ({ ...DEFAULT_SET }))];
            }
            return {
              ...ex,
              sets: sets.map((st, i) => {
                const prev = was.sets[i] ?? was.sets[was.sets.length - 1];
                if (!prev || st.done || st.touched) return st;
                return { ...st, reps: prev.reps, weight: Number(prev.weight) };
              }),
            };
          }),
        })),
      discard: () => setSession(null),
      finish: async () => {
        if (!session) throw new Error("No workout in progress");
        const sets: NewWorkoutSet[] = [];
        for (const ex of session.exercises) {
          let n = 1;
          for (const st of ex.sets) {
            if (st.done) sets.push({ exercise_id: ex.exerciseId, reps: st.reps, weight: st.weight, set_number: n++ });
          }
        }
        const res = await workoutsApi.createWorkout({
          routine_id: session.routineId,
          duration: Math.round((Date.now() - session.startedAt) / 1000),
          sets,
        });
        setSession(null);
        return res.id;
      },
    }),
    [session, start, mutate, mapExercise],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession must be used inside <SessionProvider>");
  return v;
}

/** Re-render every second while mounted (session clock, rest timer). */
export function useTick(active = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [active]);
  return now;
}
