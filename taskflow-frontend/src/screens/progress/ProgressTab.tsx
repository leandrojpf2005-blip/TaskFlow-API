import { useEffect, useMemo, useState } from "react";
import {
  Dumbbell,
  Plus,
  Ruler,
  Scale,
  Share2,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import * as measurementsApi from "../../api/measurements";
import * as workoutsApi from "../../api/workouts";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { useFmt, type Fmt } from "../../lib/useFmt";
import { useExerciseName } from "../../lib/exercises";
import { daysBetween, parseDay } from "../../lib/dates";
import { Chip, EmptyState, ErrorBanner, ITile, PBar, Pills, SectionHead, Segmented, StatTile, TabHeader, errText } from "../../components/ui";
import { LineChart, type Pt } from "./LineChart";
import { LogWeight } from "./LogWeight";
import { LogMeasures } from "./LogMeasures";
import { Goals } from "../more/Goals";
import type { Measurement } from "../../types/measurements";
import type { WorkoutDetail } from "../../types/workouts";
import type { Translate } from "../../lib/i18n";

type Pane = "weight" | "measures" | "exercises";
type Period = "week" | "month" | "all";
type Metric = "chest_cm" | "waist_cm" | "arm_cm" | "thigh_cm";

const DAY = 86_400_000;
const PERIOD_DAYS: Record<Period, number | null> = { week: 7, month: 30, all: null };

function periodStart(p: Period, firstT: number, now: number): number {
  const d = PERIOD_DAYS[p];
  return d === null ? firstT : now - d * DAY;
}

/** Six evenly spaced x-axis labels; the last one is always "Today". */
function xLabels(p: Period, from: number, to: number, t: Translate, f: Fmt): string[] {
  return Array.from({ length: 6 }, (_, i) => {
    if (i === 5) return t("common.today");
    const at = new Date(from + ((to - from) * i) / 5);
    if (p === "week") return f.date(at, { weekday: "short" }).replace(".", "");
    if (p === "month") return t("progress.weekShort", { n: i + 1 });
    return f.date(at, { month: "short" }).replace(".", "");
  });
}

function relDate(iso: string, t: Translate, f: Fmt): string {
  const d = parseDay(iso);
  const days = daysBetween(d, new Date());
  if (days === 0) return t("common.today");
  if (days === 1) return t("common.yesterday");
  return f.dayMonth(d);
}

export function ProgressTab() {
  const { t } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { version, toast, profile } = useApp();
  const [pane, setPane] = useState<Pane>("weight");
  const [period, setPeriod] = useState<Period>("month");
  const [items, setItems] = useState<Measurement[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    measurementsApi
      .getMeasurements()
      .then((m) => live && setItems([...m].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)))
      .catch((e) => live && (setError(errText(e, t)), setItems([])));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version.measurements]);

  const weights = useMemo(() => (items ?? []).filter((m) => m.weight_kg !== null), [items]);

  const share = async () => {
    const cur = weights[weights.length - 1]?.weight_kg;
    const first = weights[0]?.weight_kg;
    if (cur == null || first == null) return;
    const text = t("progress.shareText", {
      w: `${f.weight(Number(cur))} ${f.wUnit}`,
      d: `${f.weightSigned(Number(cur) - Number(first))} ${f.wUnit}`,
    });
    try {
      if (navigator.share) await navigator.share({ title: "Uplift", text });
      else {
        await navigator.clipboard.writeText(text);
        toast(t("progress.copied"));
      }
    } catch {
      /* share sheet dismissed */
    }
  };

  // Losing is the good direction on a cut, gaining on a bulk.
  const wantsLoss = (profile.weekly_change_kg ?? 0) <= 0;

  return (
    <div className="page">
      <TabHeader
        title={t("progress.title")}
        subtitle={t("progress.subtitle")}
        right={
          <button className="square-btn" onClick={share} aria-label={t("progress.share")} disabled={weights.length === 0}>
            <Share2 />
          </button>
        }
      />
      <Segmented
        value={pane}
        onChange={setPane}
        options={[
          { value: "weight", label: t("progress.tab.weight") },
          { value: "measures", label: t("progress.tab.measures") },
          { value: "exercises", label: t("progress.tab.exercises") },
        ]}
      />
      {pane !== "exercises" && (
        <Pills
          value={period}
          onChange={setPeriod}
          options={[
            { value: "week", label: t("progress.period.week") },
            { value: "month", label: t("progress.period.month") },
            { value: "all", label: t("progress.period.all") },
          ]}
        />
      )}
      <ErrorBanner message={error} onClose={() => setError(null)} />

      {items === null && pane !== "exercises" ? (
        <p className="splash">{t("common.loading")}</p>
      ) : pane === "weight" ? (
        <WeightPane weights={weights} period={period} wantsLoss={wantsLoss} onLog={() => nav.push(<LogWeight />)} onGoal={() => nav.push(<Goals />)} />
      ) : pane === "measures" ? (
        <MeasuresPane items={items ?? []} period={period} wantsLoss={wantsLoss} onLog={() => nav.push(<LogMeasures />)} />
      ) : (
        <ExercisesPane />
      )}
    </div>
  );
}

function WeightPane({
  weights,
  period,
  wantsLoss,
  onLog,
  onGoal,
}: {
  weights: Measurement[];
  period: Period;
  wantsLoss: boolean;
  onLog: () => void;
  onGoal: () => void;
}) {
  const { t } = useLang();
  const f = useFmt();
  const { profile } = useApp();
  const [showAll, setShowAll] = useState(false);
  const [now] = useState(() => Date.now());

  if (weights.length === 0) {
    return (
      <EmptyState
        icon={Scale}
        title={t("progress.noWeight")}
        text={t("progress.noWeightHint")}
        action={
          <button className="btn btn-primary" onClick={onLog}>
            <Plus />
            {t("progress.logWeight")}
          </button>
        }
      />
    );
  }

  const w = (m: Measurement) => Number(m.weight_kg);
  const current = w(weights[weights.length - 1]);
  const start = w(weights[0]);
  const sinceStart = current - start;
  const firstT = parseDay(weights[0].date).getTime();
  const from = periodStart(period, firstT, now);
  const inPeriod = weights.filter((m) => parseDay(m.date).getTime() >= from);
  // Carry the last reading before the window in, so the line starts at the edge.
  const before = weights.filter((m) => parseDay(m.date).getTime() < from).pop();
  const series = before ? [before, ...inPeriod] : inPeriod;
  const pts: Pt[] = series.map((m) => ({ t: Math.max(from, parseDay(m.date).getTime()), v: w(m) }));
  const periodChange = series.length > 1 ? w(series[series.length - 1]) - w(series[0]) : 0;
  const maxInPeriod = Math.max(...series.map(w));
  const good = (delta: number) => (wantsLoss ? delta <= 0 : delta >= 0);
  const periodWord = period === "week" ? t("progress.thisWeek") : period === "month" ? t("progress.thisMonth") : t("progress.overall");

  const goal = profile.goal_weight_kg;
  const goalSupported = "goal_weight_kg" in profile;
  let goalPct = 0;
  if (goal != null && start !== goal) goalPct = Math.max(0, Math.min(1, (start - current) / (start - goal)));

  const recent = [...weights].reverse();
  const shown = showAll ? recent : recent.slice(0, 3);

  return (
    <>
      <section className="card">
        <div className="big-weight">
          <div>
            <small>{t("progress.currentWeight")}</small>
            <div className="num">
              <b className="tnum">{f.bw(current)}</b>
              <span>{f.wUnit}</span>
            </div>
            <div className="since">
              <Chip tone={good(sinceStart) ? "green" : "coral"} icon={sinceStart <= 0 ? TrendingDown : TrendingUp}>
                <span className="tnum">
                  {f.weightSigned(sinceStart)} {f.wUnit}
                </span>
              </Chip>
              {t("progress.sinceStart")}
            </div>
          </div>
          <ITile icon={Scale} />
        </div>

        <div className="chart-box">
          <div className="chart-top">
            <span className="tnum">
              {f.bw(maxInPeriod)} {f.wUnit}
            </span>
            {series.length > 1 && (
              <Chip tone={good(periodChange) ? "green" : "coral"}>
                <span className="tnum">
                  {f.weightSigned(periodChange)} {f.wUnit} {periodWord}
                </span>
              </Chip>
            )}
          </div>
          {pts.length > 1 ? (
            <>
              <LineChart points={pts} from={from} to={now} label={t("progress.legend", { unit: f.wUnit })} />
              <div className="chart-x">
                {xLabels(period, from, now, t, f).map((l, i) => (
                  <span key={i} className={i === 5 ? "now" : ""}>
                    {l}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="muted" style={{ fontSize: 13, padding: "18px 0 6px", textAlign: "center" }}>
              {t("progress.notEnough")}
            </p>
          )}
          <p className="chart-legend">
            <i className="mdot" style={{ background: "var(--accent)" }} />
            {t("progress.legend", { unit: f.wUnit })}
            <b className="tnum">
              {f.bw(w(series[0]))} → {f.bw(current)}
            </b>
          </p>
        </div>

        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={onLog}>
          <Plus />
          {t("progress.logWeight")}
        </button>
      </section>

      {goalSupported &&
        (goal != null ? (
          <button className="card goal-card" onClick={onGoal} style={{ display: "block" }}>
            <div className="goal-card" style={{ marginBottom: 12 }}>
              <ITile icon={Target} tone="coral" />
              <div className="grow">
                <b>{t("progress.goal", { w: `${f.weight(goal)} ${f.wUnit}` })}</b>
                <small className="tnum">
                  {Math.abs(current - goal) < 0.05
                    ? t("progress.goalReached")
                    : t("progress.toGo", { w: `${f.weight(Math.abs(current - goal))} ${f.wUnit}` })}
                </small>
              </div>
              <span className="pct tnum">{Math.round(goalPct * 100)}%</span>
            </div>
            <PBar value={goalPct} max={1} tone="coral" />
          </button>
        ) : (
          <button className="card goal-card" onClick={onGoal}>
            <ITile icon={Target} tone="coral" />
            <div className="grow">
              <b>{t("progress.setGoal")}</b>
              <small>{t("progress.setGoalHint")}</small>
            </div>
          </button>
        ))}

      <SectionHead
        title={t("progress.recent")}
        action={
          recent.length > 3 && (
            <button className="link" onClick={() => setShowAll((s) => !s)}>
              {showAll ? t("progress.showLess") : t("common.seeAll")}
            </button>
          )
        }
      />
      {shown.map((m, i) => {
        const prev = recent[recent.indexOf(m) + 1];
        const delta = prev ? w(m) - w(prev) : null;
        return (
          <div className="card record" key={m.id}>
            <ITile icon={Scale} tone={i === 0 ? "green" : "beige"} size="sm" />
            <div className="grow">
              <b className="tnum">
                {f.bw(w(m))} {f.wUnit}
              </b>
              <small>
                {relDate(m.date, t, f)}
                {m.note ? ` · ${m.note}` : ""}
              </small>
            </div>
            {delta !== null && Math.abs(delta) >= 0.05 && (
              <Chip tone={good(delta) ? "green" : "coral"}>
                <span className="tnum">
                  {f.weightSigned(delta)} {f.wUnit}
                </span>
              </Chip>
            )}
          </div>
        );
      })}
    </>
  );
}

const METRICS: { key: Metric; label: "progress.measure.chest" | "progress.measure.waist" | "progress.measure.arm" | "progress.measure.thigh" }[] = [
  { key: "waist_cm", label: "progress.measure.waist" },
  { key: "chest_cm", label: "progress.measure.chest" },
  { key: "arm_cm", label: "progress.measure.arm" },
  { key: "thigh_cm", label: "progress.measure.thigh" },
];

function MeasuresPane({
  items,
  period,
  wantsLoss,
  onLog,
}: {
  items: Measurement[];
  period: Period;
  wantsLoss: boolean;
  onLog: () => void;
}) {
  const { t } = useLang();
  const f = useFmt();
  const [metric, setMetric] = useState<Metric>("waist_cm");
  const [now] = useState(() => Date.now());
  const rows = items.filter((m) => m[metric] !== null);
  const anyTape = items.some((m) => METRICS.some((x) => m[x.key] !== null));

  if (!anyTape) {
    return (
      <EmptyState
        icon={Ruler}
        title={t("progress.noMeasures")}
        text={t("progress.noMeasuresHint")}
        action={
          <button className="btn btn-primary" onClick={onLog}>
            <Plus />
            {t("progress.logMeasures")}
          </button>
        }
      />
    );
  }

  const v = (m: Measurement) => Number(m[metric]);
  const latestOf = (k: Metric) => [...items].reverse().find((m) => m[k] !== null);
  const firstOf = (k: Metric) => items.find((m) => m[k] !== null);

  let body = null;
  if (rows.length > 0) {
    const firstT = parseDay(rows[0].date).getTime();
    const from = periodStart(period, firstT, now);
    const before = rows.filter((m) => parseDay(m.date).getTime() < from).pop();
    const series = [...(before ? [before] : []), ...rows.filter((m) => parseDay(m.date).getTime() >= from)];
    const pts = series.map((m) => ({ t: Math.max(from, parseDay(m.date).getTime()), v: v(m) }));
    const cur = v(rows[rows.length - 1]);
    const since = cur - v(rows[0]);
    // Waist going down is progress on a cut; arms/chest going up generally are.
    const good = metric === "waist_cm" ? (wantsLoss ? since <= 0 : true) : since >= 0;
    body = (
      <>
        <div className="big-weight">
          <div>
            <small>{t(METRICS.find((x) => x.key === metric)!.label)}</small>
            <div className="num">
              <b className="tnum">{f.length(cur)}</b>
              <span>{f.lUnit}</span>
            </div>
            <div className="since">
              <Chip tone={good ? "green" : "coral"} icon={since <= 0 ? TrendingDown : TrendingUp}>
                <span className="tnum">
                  {f.lengthSigned(since)} {f.lUnit}
                </span>
              </Chip>
              {t("progress.sinceStart")}
            </div>
          </div>
          <ITile icon={Ruler} />
        </div>
        <div className="chart-box">
          {pts.length > 1 ? (
            <>
              <LineChart points={pts} from={from} to={now} label={t(METRICS.find((x) => x.key === metric)!.label)} />
              <div className="chart-x">
                {xLabels(period, from, now, t, f).map((l, i) => (
                  <span key={i} className={i === 5 ? "now" : ""}>
                    {l}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="muted" style={{ fontSize: 13, padding: "14px 0", textAlign: "center" }}>
              {t("progress.notEnoughMeasures")}
            </p>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="metric-chips">
        {METRICS.map((m) => (
          <button key={m.key} className={metric === m.key ? "on" : ""} onClick={() => setMetric(m.key)}>
            {t(m.label)}
          </button>
        ))}
      </div>
      <section className="card">
        {body ?? <p className="muted" style={{ fontSize: 14 }}>{t("progress.noMetric")}</p>}
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={onLog}>
          <Plus />
          {t("progress.logMeasures")}
        </button>
      </section>

      <SectionHead title={t("progress.latest")} />
      <section className="card target-table">
        {METRICS.map((m) => {
          const last = latestOf(m.key);
          const first = firstOf(m.key);
          const delta = last && first ? Number(last[m.key]) - Number(first[m.key]) : null;
          return (
            <div className="target-row" key={m.key}>
              <ITile icon={Ruler} tone="beige" size="sm" />
              <div className="grow">
                <b>{t(m.label)}</b>
                <small>{last ? relDate(last.date, t, f) : "—"}</small>
              </div>
              {delta !== null && Math.abs(delta) >= 0.05 && (
                <span className="muted tnum" style={{ fontSize: 13, fontWeight: 600 }}>
                  {f.lengthSigned(delta)}
                </span>
              )}
              <b className="tnum">{last ? `${f.length(Number(last[m.key]))} ${f.lUnit}` : "—"}</b>
            </div>
          );
        })}
      </section>
    </>
  );
}

interface LiftPoint {
  t: number;
  weight: number;
  reps: number;
  e1rm: number;
}

/** Per-exercise progress, built from the details of recent workouts. */
function ExercisesPane() {
  const { t } = useLang();
  const f = useFmt();
  const { version } = useApp();
  const exName = useExerciseName();
  // keyed by exercise id; apiNames keeps the stored name for exercises no longer in the library
  const [series, setSeries] = useState<Map<number, LiftPoint[]> | null>(null);
  const [apiNames, setApiNames] = useState<Map<number, string>>(new Map());
  const [picked, setPicked] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const list = await workoutsApi.getWorkouts();
        // No per-exercise history endpoint yet (ticketed), so read the last 40
        // sessions' sets and keep each session's best set per exercise.
        const details = await Promise.all(
          list.slice(0, 40).map((w) => workoutsApi.getWorkout(w.id).catch(() => null as WorkoutDetail | null)),
        );
        const map = new Map<number, LiftPoint[]>();
        const labels = new Map<number, string>();
        details.forEach((d, i) => {
          if (!d) return;
          const at = new Date(list[i].date).getTime();
          const best = new Map<number, LiftPoint>();
          for (const st of d.sets) {
            const id = st.exercise_id;
            if (st.name) labels.set(id, st.name);
            const weight = Number(st.weight);
            const e1rm = weight * (1 + st.reps / 30);
            const cur = best.get(id);
            // The heaviest set and the best estimated 1RM can come from different sets.
            const topE1rm = Math.max(e1rm, cur?.e1rm ?? 0);
            if (!cur || weight > cur.weight || (weight === cur.weight && st.reps > cur.reps)) {
              best.set(id, { t: at, weight, reps: st.reps, e1rm: topE1rm });
            } else {
              cur.e1rm = topE1rm;
            }
          }
          best.forEach((p, id) => map.set(id, [...(map.get(id) ?? []), p]));
        });
        map.forEach((pts) => pts.sort((a, b) => a.t - b.t));
        if (live) {
          setApiNames(labels);
          setSeries(map);
        }
      } catch (e) {
        if (live) {
          setError(errText(e, t));
          setSeries(new Map());
        }
      }
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version.workouts]);

  if (series === null) return <p className="splash">{t("common.loading")}</p>;
  if (series.size === 0)
    return (
      <>
        <ErrorBanner message={error} />
        <EmptyState icon={Dumbbell} title={t("progress.noExercises")} text={t("progress.noExercisesHint")} />
      </>
    );

  const ids = [...series.keys()].sort((a, b) => series.get(b)!.length - series.get(a)!.length);
  const id = picked !== null && series.has(picked) ? picked : ids[0];
  const pts = series.get(id)!;
  const top = pts.reduce((a, p) => (p.weight > a.weight || (p.weight === a.weight && p.reps > a.reps) ? p : a), pts[0]);
  const best1rm = Math.max(...pts.map((p) => p.e1rm));
  const first = pts[0];
  const lastP = pts[pts.length - 1];

  return (
    <>
      <div className="metric-chips">
        {ids.slice(0, 15).map((n) => (
          <button key={n} className={n === id ? "on" : ""} onClick={() => setPicked(n)}>
            {exName(n, apiNames.get(n) ?? `#${n}`)}
          </button>
        ))}
      </div>

      <section className="card">
        <div className="big-weight">
          <div>
            <small>{t("progress.bestSet")}</small>
            <div className="num">
              <b className="tnum">{f.weight(top.weight)}</b>
              <span>
                {f.wUnit} × {top.reps}
              </span>
            </div>
            <div className="since">
              <Chip tone={lastP.weight >= first.weight ? "green" : "coral"} icon={lastP.weight >= first.weight ? TrendingUp : TrendingDown}>
                <span className="tnum">
                  {f.weightSigned(lastP.weight - first.weight)} {f.wUnit}
                </span>
              </Chip>
              {t("progress.sinceFirst")}
            </div>
          </div>
          <ITile icon={Trophy} tone="coral" />
        </div>
        <div className="chart-box">
          <div className="chart-top">
            <span>{t("progress.topWeight", { unit: f.wUnit })}</span>
          </div>
          {pts.length > 1 ? (
            <LineChart
              points={pts.map((p) => ({ t: p.t, v: p.weight }))}
              from={pts[0].t}
              to={pts[pts.length - 1].t}
              label={t("progress.topWeight", { unit: f.wUnit })}
            />
          ) : (
            <p className="muted" style={{ fontSize: 13, padding: "14px 0", textAlign: "center" }}>
              {t("progress.notEnoughLifts")}
            </p>
          )}
        </div>
        <div className="stat-tiles" style={{ marginTop: 12 }}>
          <StatTile value={f.weight(best1rm, 0)} unit={f.wUnit} label={t("progress.est1rm")} />
          <StatTile value={pts.length} label={t("progress.sessions")} />
          <StatTile value={`${f.weight(lastP.weight)}`} unit={f.wUnit} label={t("progress.lastTime")} />
        </div>
      </section>

      <SectionHead title={t("progress.history")} />
      {[...pts].reverse().slice(0, 8).map((p, i) => (
        <div className="card record" key={i}>
          <ITile icon={Dumbbell} tone={i === 0 ? "green" : "beige"} size="sm" />
          <div className="grow">
            <b className="tnum">
              {f.weight(p.weight)} {f.wUnit} × {p.reps}
            </b>
            <small>{f.dayMonth(new Date(p.t), true)}</small>
          </div>
          <Chip tone="neutral">
            <span className="tnum">1RM ≈ {f.weight(p.e1rm, 0)}</span>
          </Chip>
        </div>
      ))}
    </>
  );
}
