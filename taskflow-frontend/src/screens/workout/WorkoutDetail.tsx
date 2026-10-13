import { useEffect, useMemo, useState } from "react";
import { Clock, Dumbbell, Layers, Repeat, Trash2, Weight } from "lucide-react";
import * as api from "../../api/workouts";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { useFmt } from "../../lib/useFmt";
import { kgTo } from "../../lib/units";
import { ErrorBanner, ITile, ScreenHeader, StatTile, errText, useConfirm } from "../../components/ui";
import { workoutToSession } from "./start";
import { useStarter } from "./useStarter";
import type { WorkoutDetail as Detail, WorkoutSet, WorkoutSummary } from "../../types/workouts";

/** One finished workout: totals, every set, repeat or delete. */
export function WorkoutDetail({ workout }: { workout: WorkoutSummary }) {
  const { t } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { bump, toast } = useApp();
  const starter = useStarter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmNode, ask] = useConfirm();
  const name = workout.name ?? t("workout.free");

  useEffect(() => {
    api
      .getWorkout(workout.id)
      .then(setDetail)
      .catch((e) => setError(errText(e, t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout.id]);

  const blocks = useMemo(() => {
    const m = new Map<number, { name: string; sets: WorkoutSet[] }>();
    for (const st of [...(detail?.sets ?? [])].sort((a, b) => a.id - b.id)) {
      const b = m.get(st.exercise_id) ?? { name: st.name ?? "—", sets: [] };
      b.sets.push(st);
      m.set(st.exercise_id, b);
    }
    return [...m.values()];
  }, [detail]);

  const remove = async () => {
    const ok = await ask({ title: t("wdetail.confirmDelete"), confirm: t("common.delete"), cancel: t("common.cancel"), danger: true });
    if (!ok) return;
    try {
      await api.deleteWorkout(workout.id);
      bump("workouts");
      toast(t("wdetail.deleted"));
      nav.pop();
    } catch (e) {
      setError(errText(e, t));
    }
  };

  const when = f.date(new Date(workout.date), { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="page bare">
      <ScreenHeader title={name} subtitle={when} onBack={nav.pop} backLabel={t("common.back")} />
      <ErrorBanner message={error ?? starter.error} onClose={() => (setError(null), starter.clearError())} />

      <section className="card">
        <div className="stat-tiles">
          <StatTile icon={Clock} value={f.num(Math.max(1, Math.round((workout.duration ?? 0) / 60)))} unit="min" label={t("session.duration")} />
          <StatTile icon={Weight} value={f.num(kgTo(workout.volume, f.wUnit))} unit={f.wUnit} label={t("session.volume")} />
          <StatTile icon={Layers} value={workout.set_count} label={t("session.setsLabel")} />
        </div>
      </section>

      {!detail && !error && <p className="splash">{t("common.loading")}</p>}

      {blocks.map((b, i) => (
        <section className="card" key={i}>
          <div className="ex-head">
            <ITile icon={Dumbbell} />
            <div className="grow">
              <b>{b.name}</b>
              <small>{t("workout.setsCount", { n: b.sets.length })}</small>
            </div>
          </div>
          {b.sets.map((st, j) => (
            <div className="set-grid" key={st.id} style={{ gridTemplateColumns: "38px 1fr" }}>
              <span className="set-num" style={{ background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }}>
                {j + 1}
              </span>
              <span className="tnum" style={{ fontWeight: 700 }}>
                {f.weight(Number(st.weight))} {f.wUnit} × {st.reps}
              </span>
            </div>
          ))}
        </section>
      ))}

      <div className="sticky-cta">
        <button
          className="btn btn-primary"
          onClick={() => starter.start(() => workoutToSession(workout.id, name, workout.routine_id))}
          disabled={starter.starting}
        >
          <Repeat />
          {t("workout.repeat")}
        </button>
        <button className="btn btn-danger" onClick={remove}>
          <Trash2 />
          {t("wdetail.delete")}
        </button>
      </div>
      {starter.confirmNode}
      {confirmNode}
    </div>
  );
}
