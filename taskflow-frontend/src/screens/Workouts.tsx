import { useEffect, useMemo, useState } from "react";
import * as api from "../api/workouts";
import type { Routine, WorkoutSummary } from "../types/workouts";
import { WorkoutSession, type SessionInit } from "./WorkoutSession";
import { useT } from "../lib/langHooks";
import type { Translate } from "../lib/i18n";

const errMsg = (e: unknown, t: Translate) =>
  e instanceof Error ? e.message : t("common.somethingWrong");

type Pane = "today" | "routines" | "history";

/** How many sessions a week counts as "on plan" — the 2/4 on the week card. */
const WEEKLY_GOAL = 4;

/** Monday-based index (0 = Mon … 6 = Sun), matching the week strip. */
function dayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function startOfWeek(now = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - dayIndex(d));
  return d;
}

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

function relativeDay(iso: string, t: Translate): string {
  const d = new Date(iso);
  const today = new Date();
  const days = Math.round((today.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  if (days === 0) return t("common.today");
  if (days === 1) return t("common.yesterday");
  if (days < 7) return `${days}d`;
  return fmtDate(iso);
}

const fmtDur = (s: number | null) => (s ? `${Math.round(s / 60)} min` : "—");
const fmtVolume = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)));

export function Workouts() {
  const t = useT();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [history, setHistory] = useState<WorkoutSummary[]>([]);
  const [session, setSession] = useState<SessionInit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [pane, setPane] = useState<Pane>("today");

  const load = () => {
    Promise.all([api.getRoutines(), api.getWorkouts()])
      .then(([r, w]) => {
        setRoutines(r);
        setHistory(w);
      })
      .catch((e) => setError(errMsg(e, t)))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    // Initial fetch only; `load` is re-created each render and is called again
    // explicitly after a session is saved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The week strip is derived from the history we already hold — no extra
  // endpoint needed, since GET /workouts returns every session with its date.
  const week = useMemo(() => {
    const from = startOfWeek();
    const trained = new Set<number>();
    for (const w of history) {
      const d = new Date(w.date);
      if (d >= from) trained.add(dayIndex(d));
    }
    return { trained, today: dayIndex(new Date()) };
  }, [history]);

  const last = history[0] ?? null;

  const startFree = () => setSession({ routineId: null, name: t("workout.free"), exercises: [] });

  const startRoutine = async (routine: Routine) => {
    setStarting(true);
    setError(null);
    try {
      // The routine detail now carries exercise_id, so the session can be built
      // from one request instead of a name lookup per exercise.
      const exs = await api.getRoutineExercises(routine.id);
      setSession({
        routineId: routine.id,
        name: routine.name,
        exercises: exs.map((re) => ({
          exerciseId: re.exercise_id,
          name: re.name,
          sets: Array.from({ length: Math.max(1, re.sets) }, () => ({
            reps: 10,
            weight: 20,
            done: false,
          })),
        })),
      });
    } catch (e) {
      setError(errMsg(e, t));
    } finally {
      setStarting(false);
    }
  };

  const repeat = async (w: WorkoutSummary) => {
    setStarting(true);
    setError(null);
    try {
      const detail = await api.getWorkout(w.id);
      // Group the previous session's sets back into per-exercise blocks,
      // keeping the weights as the starting point for today.
      const byExercise = new Map<number, SessionInit["exercises"][number]>();
      for (const s of detail.sets) {
        let block = byExercise.get(s.exercise_id);
        if (!block) {
          block = { exerciseId: s.exercise_id, name: s.name ?? "—", sets: [] };
          byExercise.set(s.exercise_id, block);
        }
        block.sets.push({ reps: s.reps, weight: Number(s.weight), done: false });
      }
      setSession({
        routineId: w.routine_id,
        name: w.name ?? t("workout.title"),
        exercises: [...byExercise.values()],
      });
    } catch (e) {
      setError(errMsg(e, t));
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

  return (
    <div className="pad">
      <header className="screen-head">
        <div>
          <h1>{t("workout.title")}</h1>
          <p className="sub">{t("workout.subtitle")}</p>
        </div>
      </header>

      {error && <p className="err">{error}</p>}

      <div className="seg-tabs" role="tablist">
        {(["today", "routines", "history"] as Pane[]).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={pane === p}
            className={pane === p ? "on" : ""}
            onClick={() => setPane(p)}
          >
            {t(p === "today" ? "workout.tab.today" : p === "routines" ? "workout.tab.routines" : "workout.tab.history")}
          </button>
        ))}
      </div>

      {pane === "today" && (
        <>
          <section className="card">
            <div className="card-head">
              <b>{t("workout.thisWeek")}</b>
              <span className="accent-text">
                {t("workout.weekCount", { done: week.trained.size, goal: WEEKLY_GOAL })}
              </span>
            </div>
            <div className="week-strip">
              {DAY_LETTERS.map((letter, i) => {
                const done = week.trained.has(i);
                const isToday = week.today === i;
                return (
                  <span
                    key={i}
                    className={`day-dot${done ? " done" : ""}${isToday ? " today" : ""}`}
                    aria-label={`${letter}${done ? " — trained" : ""}`}
                  >
                    {done ? "✓" : letter}
                  </span>
                );
              })}
            </div>
            <div className="bar">
              <span
                style={{ width: `${Math.min(100, (week.trained.size / WEEKLY_GOAL) * 100)}%` }}
              />
            </div>
          </section>

          <section className="card center">
            <div className="card-badge">🏋</div>
            <h2 className="card-title">{t("workout.ready")}</h2>
            <p className="muted small">{t("workout.readyHint")}</p>
            <button className="btn-primary btn-block" onClick={startFree} disabled={starting}>
              ▶ {t("workout.start")}
            </button>
            <button
              className="btn-soft btn-block"
              onClick={() => setPane("routines")}
              disabled={starting || routines.length === 0}
            >
              {t("workout.startRoutine")}
            </button>
          </section>

          {last && (
            <>
              <h2 className="section-title">{t("workout.last")}</h2>
              <section className="card">
                <div className="card-head">
                  <div>
                    <b>{last.name ?? t("workout.free")}</b>
                    <p className="muted small">
                      {relativeDay(last.date, t)} · {fmtDur(last.duration)}
                    </p>
                  </div>
                  <span className="chip chip-good">✓ {t("workout.done")}</span>
                </div>
                <div className="stat-row">
                  <Stat value={last.exercise_count} label={t("workout.exercises")} />
                  <Stat value={last.set_count} label={t("workout.sets")} />
                  <Stat value={fmtVolume(last.volume)} label={t("workout.volume")} unit="kg" />
                </div>
                <button className="btn-soft btn-block" onClick={() => repeat(last)} disabled={starting}>
                  ⟳ {t("workout.repeat")}
                </button>
              </section>
            </>
          )}
        </>
      )}

      {pane === "routines" && (
        <>
          {loading ? (
            <div className="splash">{t("common.loading")}</div>
          ) : routines.length ? (
            <ul className="list">
              {routines.map((r) => (
                <li key={r.id}>
                  <button className="list-row tap" onClick={() => startRoutine(r)} disabled={starting}>
                    <strong>{r.name}</strong>
                    <span className="muted">{starting ? t("common.starting") : "›"}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">{t("workout.noRoutines")}</p>
          )}
        </>
      )}

      {pane === "history" && (
        <>
          {loading ? (
            <div className="splash">{t("common.loading")}</div>
          ) : history.length ? (
            <ul className="list">
              {history.map((w) => (
                <li key={w.id} className="list-row">
                  <div>
                    <strong>{w.name ?? t("workout.free")}</strong>
                    <p className="muted small">
                      {fmtDate(w.date)} · {w.exercise_count} {t("workout.exercises")} · {w.set_count} {t("workout.sets")} ·{" "}
                      {fmtVolume(w.volume)} kg
                    </p>
                  </div>
                  <button className="btn-ghost" onClick={() => repeat(w)} disabled={starting}>
                    ⟳
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">{t("workout.noHistory")}</p>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ value, label, unit }: { value: number | string; label: string; unit?: string }) {
  return (
    <div className="stat-cell">
      <span className="stat-value">
        {value}
        {unit && <small>{unit}</small>}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
