import { useEffect, useRef, useState } from "react";
import * as api from "../api/workouts";
import type {
  NewWorkout,
  NewWorkoutSet,
  Exercise,
  LastPerformanceMap,
} from "../types/workouts";
import { ExerciseSearchSheet } from "../components/ExerciseSearchSheet";
import { IconChevronLeft } from "../components/icons";
import { useT } from "../lib/langHooks";
import type { Translate } from "../lib/i18n";

export interface SessionSet {
  reps: number;
  weight: number;
  done: boolean;
  /** Set once the user edits the row, so prefilling never overwrites them. */
  touched?: boolean;
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

/** Weights arrive as Decimal-backed numbers; drop the trailing ".0". */
const fmtKg = (w: number) => `${Number(w)}kg`;

function lastWhen(iso: string, t: Translate): string {
  const days = Math.round(
    (new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86400000,
  );
  if (days <= 0) return t("common.today").toLowerCase();
  if (days === 1) return t("common.yesterday").toLowerCase();
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function WorkoutSession({
  init,
  onExit,
  onSaved,
}: {
  init: SessionInit;
  onExit: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const [exercises, setExercises] = useState<SessionExercise[]>(init.exercises);
  const startRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState(0);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // What was lifted the last time each exercise was trained, so every set row
  // can show something to beat. Fetched for all exercises in one request, and
  // topped up when an exercise is added mid-session.
  const [lastPerf, setLastPerf] = useState<LastPerformanceMap>({});

  const fetchLastPerf = (ids: number[]) => {
    const missing = ids.filter((id) => !(String(id) in lastPerf));
    if (missing.length === 0) return;
    api
      .getLastPerformance(missing)
      .then((map) => {
        setLastPerf((prev) => ({ ...prev, ...map }));
        // Seed each untouched set with what was lifted last time, so the common
        // case is "same again" and only the sets that changed need editing.
        setExercises((prev) =>
          prev.map((ex) => {
            const was = map[String(ex.exerciseId)];
            if (!was) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s, i) => {
                const match = was.sets[i];
                if (!match || s.done || s.touched) return s;
                return { ...s, reps: match.reps, weight: Number(match.weight) };
              }),
            };
          }),
        );
      })
      // History is a nicety — a failure here must not break the session.
      .catch(() => {});
  };

  useEffect(() => {
    fetchLastPerf(init.exercises.map((e) => e.exerciseId));
    // Only on mount: later exercises are fetched as they are added.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    fetchLastPerf([ex.id]);
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
      setError(t("session.needOneSet"));
      return;
    }
    setSaving(true);
    try {
      const body: NewWorkout = { routine_id: init.routineId, duration: elapsed, sets };
      await api.createWorkout(body);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("session.saveFailed"));
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
        <span className="active">● {t("session.active")}</span>
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
        <div className="emptystate">{t("session.empty")}</div>
      )}

      {exercises.map((ex, ei) => {
        const prev = lastPerf[String(ex.exerciseId)];
        return (
        <div className="exblock" key={ei}>
          <div className="exname">{ex.name}</div>
          {prev && (
            <p className="lastperf">
              {t("session.lastTime")} · {lastWhen(prev.date, t)} ·{" "}
              {prev.sets.map((s) => `${fmtKg(s.weight)}×${s.reps}`).join(", ")}
            </p>
          )}
          <div className="setgrid thead">
            <span>{t("session.set")}</span>
            <span>{t("session.kg")}</span>
            <span>{t("session.reps")}</span>
            <span></span>
          </div>
          {ex.sets.map((s, si) => {
            const was = prev?.sets.find((p) => p.set_number === si + 1);
            return (
            <div className={"setgrid setrow" + (s.done ? " done" : "")} key={si}>
              <span className="setnum">
                {si + 1}
                {was && (
                  <small className="prevhint" title="Last time">
                    {fmtKg(was.weight)}×{was.reps}
                  </small>
                )}
              </span>
              <input
                className="setinput"
                type="number"
                inputMode="decimal"
                value={s.weight}
                onChange={(e) => update(ei, si, { weight: Number(e.target.value), touched: true })}
              />
              <input
                className="setinput"
                type="number"
                inputMode="numeric"
                value={s.reps}
                onChange={(e) => update(ei, si, { reps: Number(e.target.value), touched: true })}
              />
              <button className="setchk" onClick={() => toggle(ei, si)} aria-label="Complete set">
                ✓
              </button>
            </div>
            );
          })}
          <button className="addset" onClick={() => addSet(ei)}>
            ＋ {t("session.addSet")}
          </button>
        </div>
        );
      })}

      <button className="addex" onClick={() => setPicking(true)}>
        ＋ {t("session.addExercise")}
      </button>
      <button className="btn" onClick={finish} disabled={saving}>
        {saving ? t("common.saving") : t("session.finish")}
      </button>

      {resting && (
        <div className="restbar">
          <div className="rt">
            {clock(rest)}
            <small>{t("session.rest")}</small>
          </div>
          <button onClick={() => setRest((r) => Math.max(0, r - 15))}>−15s</button>
          <button onClick={() => setRest((r) => r + 15)}>+15s</button>
          <button className="skip" onClick={() => setRest(0)}>
            {t("session.skip")}
          </button>
        </div>
      )}

      {picking && <ExerciseSearchSheet onPick={addExercise} onClose={() => setPicking(false)} />}
    </>
  );
}
