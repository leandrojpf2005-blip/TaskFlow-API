import { useEffect, useRef, useState } from "react";
import * as api from "../api/workouts";
import type { NewWorkout, NewWorkoutSet, Exercise } from "../types/workouts";
import { ExerciseSearchSheet } from "../components/ExerciseSearchSheet";
import { IconChevronLeft } from "../components/icons";

export interface SessionSet {
  reps: number;
  weight: number;
  done: boolean;
}
export interface SessionExercise {
  exerciseId: number;
  name: string;
  sets: SessionSet[];
}
export interface SessionInit {
  routineId: number | null;
  name: string;
  exercises: SessionExercise[];
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function WorkoutSession({
  init,
  onExit,
  onSaved,
}: {
  init: SessionInit;
  onExit: () => void;
  onSaved: () => void;
}) {
  const [exercises, setExercises] = useState<SessionExercise[]>(init.exercises);
  const startRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState(0);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startRef.current = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const resting = rest > 0;
  useEffect(() => {
    if (!resting) return;
    const t = setInterval(() => setRest((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [resting]);

  const doneCount = exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.done).length, 0);
  const volume = exercises.reduce(
    (a, ex) => a + ex.sets.filter((s) => s.done).reduce((b, s) => b + s.reps * s.weight, 0),
    0,
  );

  const update = (ei: number, si: number, patch: Partial<SessionSet>) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i !== ei ? ex : { ...ex, sets: ex.sets.map((s, j) => (j !== si ? s : { ...s, ...patch })) },
      ),
    );

  const toggle = (ei: number, si: number) => {
    const wasDone = exercises[ei].sets[si].done;
    update(ei, si, { done: !wasDone });
    if (!wasDone) setRest(90);
  };

  const addSet = (ei: number) =>
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== ei) return ex;
        const last = ex.sets[ex.sets.length - 1] ?? { reps: 10, weight: 20, done: false };
        return { ...ex, sets: [...ex.sets, { reps: last.reps, weight: last.weight, done: false }] };
      }),
    );

  const addExercise = (ex: Exercise) => {
    setExercises((prev) => [
      ...prev,
      { exerciseId: ex.id, name: ex.name, sets: [{ reps: 10, weight: 20, done: false }] },
    ]);
    setPicking(false);
  };

  const finish = async () => {
    setError(null);
    const sets: NewWorkoutSet[] = [];
    for (const ex of exercises) {
      let n = 1;
      for (const s of ex.sets) {
        if (s.done) sets.push({ exercise_id: ex.exerciseId, reps: s.reps, weight: s.weight, set_number: n++ });
      }
    }
    if (!sets.length) {
      setError("Complete at least one set (tap ✓).");
      return;
    }
    setSaving(true);
    try {
      const body: NewWorkout = { routine_id: init.routineId, duration: elapsed, sets };
      await api.createWorkout(body);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save workout");
      setSaving(false);
    }
  };

  return (
    <>
      <div className="appbar">
        <button className="backbtn" onClick={onExit}>
          <IconChevronLeft /> {init.name}
        </button>
      </div>

      <div className="wktimer">
        <div className="tl">
          <small>
            {doneCount} sets · {Math.round(volume).toLocaleString()} kg volume
          </small>
          <b>{clock(elapsed)}</b>
        </div>
        <span className="active">● Active</span>
      </div>

      {error && (
        <div className="banner">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      {exercises.length === 0 && (
        <div className="emptystate">Empty workout. Add an exercise to begin.</div>
      )}

      {exercises.map((ex, ei) => (
        <div className="exblock" key={ei}>
          <div className="exname">{ex.name}</div>
          <div className="setgrid thead">
            <span>Set</span>
            <span>Kg</span>
            <span>Reps</span>
            <span></span>
          </div>
          {ex.sets.map((s, si) => (
            <div className={"setgrid setrow" + (s.done ? " done" : "")} key={si}>
              <span className="setnum">{si + 1}</span>
              <input
                className="setinput"
                type="number"
                inputMode="decimal"
                value={s.weight}
                onChange={(e) => update(ei, si, { weight: Number(e.target.value) })}
              />
              <input
                className="setinput"
                type="number"
                inputMode="numeric"
                value={s.reps}
                onChange={(e) => update(ei, si, { reps: Number(e.target.value) })}
              />
              <button className="setchk" onClick={() => toggle(ei, si)} aria-label="Complete set">
                ✓
              </button>
            </div>
          ))}
          <button className="addset" onClick={() => addSet(ei)}>
            ＋ Add set
          </button>
        </div>
      ))}

      <button className="addex" onClick={() => setPicking(true)}>
        ＋ Add exercise
      </button>
      <button className="btn" onClick={finish} disabled={saving}>
        {saving ? "Saving…" : "Finish workout"}
      </button>

      {resting && (
        <div className="restbar">
          <div className="rt">
            {clock(rest)}
            <small>Rest timer</small>
          </div>
          <button onClick={() => setRest((r) => Math.max(0, r - 15))}>−15s</button>
          <button onClick={() => setRest((r) => r + 15)}>+15s</button>
          <button className="skip" onClick={() => setRest(0)}>
            Skip
          </button>
        </div>
      )}

      {picking && <ExerciseSearchSheet onPick={addExercise} onClose={() => setPicking(false)} />}
    </>
  );
}
