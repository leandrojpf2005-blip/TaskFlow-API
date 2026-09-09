import { useEffect, useState } from "react";
import * as api from "../api/workouts";
import type { Routine, WorkoutSummary } from "../types/workouts";
import { WorkoutSession, type SessionInit } from "./WorkoutSession";

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export function Workouts() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [history, setHistory] = useState<WorkoutSummary[]>([]);
  const [session, setSession] = useState<SessionInit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const load = () => {
    Promise.all([api.getRoutines(), api.getWorkouts()])
      .then(([r, w]) => {
        setRoutines(r);
        setHistory(w);
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const startFree = () => setSession({ routineId: null, name: "Free workout", exercises: [] });

  const startRoutine = async (routine: Routine) => {
    setStarting(true);
    setError(null);
    try {
      const exs = await api.getRoutineExercises(routine.id);
      // The routine endpoint returns names + set counts but not exercise ids,
      // so resolve each id by exact-name lookup.
      const resolved = await Promise.all(
        exs.map(async (re) => {
          const matches = await api.getExercises(re.name);
          const exact = matches.find((m) => m.name.toLowerCase() === re.name.toLowerCase()) ?? matches[0];
          if (!exact) return null;
          return {
            exerciseId: exact.id,
            name: exact.name,
            sets: Array.from({ length: Math.max(1, re.sets) }, () => ({ reps: 10, weight: 20, done: false })),
          };
        }),
      );
      const exercises = resolved.filter((x): x is NonNullable<typeof x> => x !== null);
      setSession({ routineId: routine.id, name: routine.name, exercises });
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setStarting(false);
    }
  };

  if (session) {
    return (
      <WorkoutSession
        init={session}
        onExit={() => setSession(null)}
        onSaved={() => {
          setSession(null);
          setLoading(true);
          load();
        }}
      />
    );
  }

  const routineName = (id: number | null) => routines.find((r) => r.id === id)?.name ?? "Workout";
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const fmtDur = (s: number | null) => (s ? `${Math.round(s / 60)} min` : "—");

  return (
    <>
      <div className="appbar">
        <div>
          <p className="hi">Your split</p>
          <p className="who">Workouts</p>
        </div>
      </div>

      {error && (
        <div className="banner">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <button className="wcard alt" onClick={startFree} disabled={starting}>
        <div className="wt">
          <b>Free workout</b>
          <small>No plan — add exercises as you go</small>
        </div>
        <span className="go">Start</span>
      </button>

      <div className="sechead">
        <b>Routines</b>
      </div>
      {loading ? (
        <div className="loading">Loading…</div>
      ) : routines.length ? (
        routines.map((r) => (
          <button className="row tap" key={r.id} onClick={() => startRoutine(r)} disabled={starting}>
            <div className="t">
              <b>{r.name}</b>
              <small>{starting ? "Starting…" : "Tap to start"}</small>
            </div>
            <span className="chev">›</span>
          </button>
        ))
      ) : (
        <div className="emptystate">No routines yet.</div>
      )}

      <div className="sechead">
        <b>History</b>
      </div>
      {loading ? null : history.length ? (
        history.map((w) => (
          <div className="row" key={w.id}>
            <div className="t">
              <b>{routineName(w.routine_id)}</b>
              <small>
                {fmtDate(w.date)} · {fmtDur(w.duration)}
              </small>
            </div>
          </div>
        ))
      ) : (
        <div className="emptystate">No workouts logged yet.</div>
      )}
    </>
  );
}
