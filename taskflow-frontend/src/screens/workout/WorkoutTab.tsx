import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Check,
  ChevronRight,
  Dumbbell,
  Flame,
  History,
  LayoutTemplate,
  Play,
  Repeat,
  Sparkles,
  Zap,
} from "lucide-react";
import * as api from "../../api/workouts";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { usePrefs } from "../../lib/prefs";
import { useFmt } from "../../lib/useFmt";
import { useSession, useTick } from "../../lib/session";
import { daysBetween, isoDay, mondayIndex, startOfWeek } from "../../lib/dates";
import { kgTo } from "../../lib/units";
import {
  Chip,
  EmptyState,
  ErrorBanner,
  ITile,
  PBar,
  SectionHead,
  Segmented,
  StatTile,
  TabHeader,
  errText,
  useConfirm,
} from "../../components/ui";
import { RoutineBuilder } from "./RoutineBuilder";
import { RoutinesPane } from "./RoutinesPane";
import { SwipeRow } from "../../components/Swipe";
import { WorkoutDetail } from "./WorkoutDetail";
import { routineToSession, workoutToSession } from "./start";
import { useStarter } from "./useStarter";
import type { Routine, RoutineExercise, WorkoutSummary } from "../../types/workouts";

type Pane = "today" | "routines" | "history";

/** Weeks in a row (ending this week or last) with at least one workout. */
function weekStreak(history: WorkoutSummary[]): number {
  const weeks = new Set(history.map((w) => isoDay(startOfWeek(new Date(w.date)))));
  const wk = startOfWeek();
  if (!weeks.has(isoDay(wk))) wk.setDate(wk.getDate() - 7);
  let n = 0;
  while (weeks.has(isoDay(wk))) {
    n++;
    wk.setDate(wk.getDate() - 7);
  }
  return n;
}

export function WorkoutTab() {
  const { t } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { version, bump, toast } = useApp();
  const { prefs } = usePrefs();
  const { session } = useSession();
  const now = useTick(!!session);
  const starter = useStarter();
  const [pane, setPane] = useState<Pane>("today");
  const [routines, setRoutines] = useState<Routine[] | null>(null);
  const [details, setDetails] = useState<Record<number, RoutineExercise[]>>({});
  const [history, setHistory] = useState<WorkoutSummary[] | null>(null);
  const [removed, setRemoved] = useState<Set<number>>(() => new Set()); // swiped away, waiting for the refetch
  const [error, setError] = useState<string | null>(null);
  const [confirmNode, ask] = useConfirm();

  useEffect(() => {
    let live = true;
    api
      .getWorkouts()
      .then((w) => live && setHistory(w))
      .catch((e) => live && (setError(errText(e, t)), setHistory([])));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version.workouts]);

  useEffect(() => {
    let live = true;
    api
      .getRoutines()
      .then(async (rs) => {
        if (!live) return;
        setRoutines(rs);
        const ds = await Promise.all(rs.map((r) => api.getRoutineExercises(r.id).catch(() => [] as RoutineExercise[])));
        if (!live) return;
        const map: Record<number, RoutineExercise[]> = {};
        rs.forEach((r, i) => (map[r.id] = ds[i]));
        setDetails(map);
      })
      .catch((e) => live && (setError(errText(e, t)), setRoutines([])));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version.routines]);

  const week = useMemo(() => {
    const from = startOfWeek();
    const trained = new Set<number>();
    for (const w of history ?? []) {
      const d = new Date(w.date);
      if (d >= from) trained.add(mondayIndex(d));
    }
    return trained;
  }, [history]);

  const streak = useMemo(() => weekStreak(history ?? []), [history]);
  const last = history?.[0] ?? null;

  // Suggest the routine that has gone longest without being done.
  const suggestion = useMemo(() => {
    if (!routines?.length) return null;
    const lastDone = new Map<number, number>();
    for (const w of history ?? []) {
      if (w.routine_id && !lastDone.has(w.routine_id)) lastDone.set(w.routine_id, new Date(w.date).getTime());
    }
    return [...routines].sort((a, b) => (lastDone.get(a.id) ?? 0) - (lastDone.get(b.id) ?? 0))[0];
  }, [routines, history]);

  const dayLetters = useMemo(() => {
    const monday = startOfWeek();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return f.date(d, { weekday: "narrow" });
    });
  }, [f]);
  const todayIdx = mondayIndex(new Date());

  const relDay = (iso: string) => {
    const days = daysBetween(new Date(iso), new Date());
    if (days === 0) return t("common.today");
    if (days === 1) return t("common.yesterday");
    if (days < 7) return t("common.daysAgo", { n: days });
    return f.dayMonth(new Date(iso));
  };
  const dur = (s: number | null) => (s ? `${f.num(Math.max(1, Math.round(s / 60)))} min` : "—");
  const vol = (kg: number) => f.num(kgTo(kg, f.wUnit));

  const deleteRoutine = async (r: Routine) => {
    const ok = await ask({
      title: t("workout.confirmDeleteRoutine"),
      text: r.name,
      confirm: t("common.delete"),
      cancel: t("common.cancel"),
      danger: true,
    });
    if (!ok) return;
    try {
      await api.deleteRoutine(r.id);
      bump("routines");
      toast(t("workout.routineDeleted"));
    } catch (e) {
      setError(errText(e, t));
    }
  };

  // Swipe left on a past workout: confirm, hide it at once, then delete it.
  const swipeWorkout = async (w: WorkoutSummary) => {
    const ok = await ask({
      title: t("wdetail.confirmDelete"),
      text: w.name ?? t("workout.free"),
      confirm: t("common.delete"),
      cancel: t("common.cancel"),
      danger: true,
    });
    if (!ok) return false;
    setRemoved((prev) => new Set(prev).add(w.id));
    try {
      await api.deleteWorkout(w.id);
      bump("workouts");
      toast(t("wdetail.deleted"));
      return true;
    } catch (e) {
      setRemoved((prev) => {
        const next = new Set(prev);
        next.delete(w.id);
        return next;
      });
      setError(errText(e, t));
      return false;
    }
  };

  const freeStart = () => starter.start(() => ({ routineId: null, name: t("workout.free"), exercises: [] }));

  return (
    <div className="page">
      <TabHeader
        title={t("workout.title")}
        subtitle={
          <>
            {t("workout.subtitle")} <Zap size={15} color="var(--f)" fill="var(--f)" />
          </>
        }
        right={
          <>
            {streak > 0 && (
              <span className="streak" title={t("workout.weekStreak", { n: streak })}>
                <Flame />
                {streak}
              </span>
            )}
            <button className="square-btn" onClick={() => setPane("history")} aria-label={t("workout.tab.history")}>
              <CalendarDays />
            </button>
          </>
        }
      />

      <Segmented
        value={pane}
        onChange={setPane}
        options={[
          { value: "today", label: t("workout.tab.today") },
          { value: "routines", label: t("workout.tab.routines") },
          { value: "history", label: t("workout.tab.history") },
        ]}
      />

      <ErrorBanner message={error ?? starter.error} onClose={() => (setError(null), starter.clearError())} />

      {pane === "today" && (
        <>
          <section className="card">
            <div className="card-row">
              <span className="card-title">{t("workout.thisWeek")}</span>
              <span className="accent tnum" style={{ fontSize: 13.5, fontWeight: 700 }}>
                {t("workout.weekCount", { done: week.size, goal: prefs.weeklyWorkoutGoal })}
              </span>
            </div>
            <div className="weekdots">
              {dayLetters.map((letter, i) => (
                <span key={i} className={`${week.has(i) ? "done" : ""}${i === todayIdx ? " today" : ""}`}>
                  {week.has(i) ? <Check /> : letter}
                </span>
              ))}
            </div>
            <PBar value={week.size} max={prefs.weeklyWorkoutGoal} />
          </section>

          {session ? (
            <section className="card center ready">
              <ITile icon={Activity} size="lg" round />
              <h2>{t("workout.inProgress")}</h2>
              <p>
                {session.name} · {Math.floor((now - session.startedAt) / 60000)} min
              </p>
              <button className="btn btn-primary" onClick={starter.resume}>
                <Play />
                {t("workout.resume")}
              </button>
            </section>
          ) : (
            <section className="card center ready">
              <ITile icon={Dumbbell} size="lg" round />
              <h2>{t("workout.ready")}</h2>
              <p>{t("workout.readyHint")}</p>
              <button className="btn btn-primary" onClick={freeStart} disabled={starter.starting}>
                <Play />
                {t("workout.start")}
              </button>
              <button className="btn btn-secondary" onClick={() => setPane("routines")}>
                <LayoutTemplate />
                {t("workout.startFromRoutine")}
              </button>
            </section>
          )}

          {last && (
            <>
              <SectionHead
                title={t("workout.last")}
                action={
                  <button className="link" onClick={() => setPane("history")}>
                    {t("workout.seeHistory")}
                  </button>
                }
              />
              <section className="card">
                <div className="last-top">
                  <ITile icon={Activity} tone="solid" />
                  <div className="grow">
                    <b>{last.name ?? t("workout.free")}</b>
                    <small>
                      {relDay(last.date)} · {dur(last.duration)}
                    </small>
                  </div>
                  <Chip tone="green" icon={Check}>
                    {t("workout.done")}
                  </Chip>
                </div>
                <div className="stat-tiles">
                  <StatTile value={last.exercise_count} label={t("workout.exercises")} />
                  <StatTile value={last.set_count} label={t("workout.sets")} />
                  <StatTile value={vol(last.volume)} unit={f.wUnit} label={t("workout.volume")} />
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ marginTop: 12, minHeight: 46 }}
                  onClick={() => starter.start(() => workoutToSession(last.id, last.name ?? t("workout.free"), last.routine_id))}
                  disabled={starter.starting}
                >
                  <Repeat />
                  {t("workout.repeat")}
                </button>
              </section>
            </>
          )}

          {routines !== null &&
            (suggestion ? (
              <button className="tipcard" onClick={() => starter.start(() => routineToSession(suggestion))}>
                <span className="itile glass">
                  <Sparkles />
                </span>
                <span className="grow">
                  <b>{t("workout.suggestion", { name: suggestion.name })}</b>
                  <small>{t("workout.suggestionHint", { n: details[suggestion.id]?.length ?? "…" })}</small>
                </span>
                <ChevronRight />
              </button>
            ) : (
              <button className="tipcard" onClick={() => nav.push(<RoutineBuilder />)}>
                <span className="itile glass">
                  <Sparkles />
                </span>
                <span className="grow">
                  <b>{t("workout.suggestCreate")}</b>
                  <small>{t("workout.suggestCreateHint")}</small>
                </span>
                <ChevronRight />
              </button>
            ))}
        </>
      )}

      {pane === "routines" && <RoutinesPane routines={routines} details={details} starter={starter} onDelete={deleteRoutine} />}

      {pane === "history" &&
        (history === null ? (
          <p className="splash">{t("common.loading")}</p>
        ) : history.length === 0 ? (
          <EmptyState icon={History} title={t("workout.noHistory")} text={t("workout.noHistoryHint")} />
        ) : (
          history
            .filter((w) => !removed.has(w.id))
            .map((w) => (
              <SwipeRow key={w.id} className="rec" label={t("common.delete")} onSwipe={() => swipeWorkout(w)}>
                <button
                  className="card record"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => nav.push(<WorkoutDetail workout={w} />)}
                >
                  <ITile icon={Activity} tone={w.routine_id ? "green" : "beige"} />
                  <span className="grow">
                    <b>{w.name ?? t("workout.free")}</b>
                    <small className="tnum">
                      {relDay(w.date)} · {dur(w.duration)} · {t("workout.setsCount", { n: w.set_count })} · {vol(w.volume)} {f.wUnit}
                    </small>
                  </span>
                  <ChevronRight size={19} />
                </button>
              </SwipeRow>
            ))
        ))}

      {starter.confirmNode}
      {confirmNode}
    </div>
  );
}
