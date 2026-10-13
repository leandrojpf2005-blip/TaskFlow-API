import { useState } from "react";
import { ArrowDown, ArrowUp, Dumbbell, Minus, Plus, X } from "lucide-react";
import { createRoutine } from "../../api/workouts";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { EmptyState, ErrorBanner, ITile, ScreenHeader, errText } from "../../components/ui";
import { ExercisePicker } from "./ExercisePicker";

interface Item {
  exerciseId: number;
  name: string;
  image?: string | null;
  sets: number;
}

/** "Nova rotina" — name it, pick exercises, set how many sets each. */
export function RoutineBuilder() {
  const { t } = useLang();
  const nav = useNav();
  const { bump, toast } = useApp();
  const [name, setName] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = (i: number, p: Partial<Item>) => setItems((prev) => prev.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (i: number, dir: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const save = async () => {
    if (!name.trim()) return setError(t("routine.needName"));
    if (items.length === 0) return setError(t("routine.needExercise"));
    setBusy(true);
    setError(null);
    try {
      await createRoutine({
        name: name.trim(),
        items: items.map((x) => ({ exercise_id: x.exerciseId, sets: x.sets })),
      });
      bump("routines");
      toast(t("routine.saved"));
      nav.pop();
    } catch (e) {
      setError(errText(e, t));
      setBusy(false);
    }
  };

  return (
    <div className="page bare">
      <ScreenHeader title={t("routine.title")} subtitle={t("routine.subtitle")} onBack={nav.pop} backLabel={t("common.back")} />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      <section className="card">
        <label className="field">
          <span>{t("routine.name")}</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("routine.namePlaceholder")} />
        </label>
      </section>

      <div className="list-head">
        <b>{t("routine.exercises")}</b>
        <span className="muted" style={{ fontSize: 13 }}>
          {t("workout.setsCount", { n: items.reduce((a, x) => a + x.sets, 0) })}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Dumbbell} title={t("routine.empty")} text={t("routine.emptyHint")} />
      ) : (
        items.map((it, i) => (
          <section className="card" key={`${it.exerciseId}-${i}`}>
            <div className="ex-head" style={{ marginBottom: 12 }}>
              {it.image ? <img className="ex-thumb" src={it.image} alt="" loading="lazy" /> : <ITile icon={Dumbbell} size="lg" />}
              <div className="grow">
                <b>{it.name}</b>
              </div>
              <div className="meal-edit" style={{ padding: 0 }}>
                <div className="tools">
                  <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={t("meals.moveUp")}>
                    <ArrowUp />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={t("meals.moveDown")}>
                    <ArrowDown />
                  </button>
                </div>
              </div>
              <button className="icon-del" onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))} aria-label={t("common.delete")}>
                <X />
              </button>
            </div>
            <div className="card-row">
              <span style={{ fontSize: 14, fontWeight: 600 }}>{t("routine.sets")}</span>
              <div className="card-row" style={{ gap: 12 }}>
                <button className="round-btn sm" onClick={() => patch(i, { sets: Math.max(1, it.sets - 1) })} aria-label="−">
                  <Minus />
                </button>
                <b className="tnum" style={{ fontSize: 18, minWidth: 22, textAlign: "center" }}>
                  {it.sets}
                </b>
                <button className="round-btn sm" onClick={() => patch(i, { sets: Math.min(12, it.sets + 1) })} aria-label="+">
                  <Plus />
                </button>
              </div>
            </div>
          </section>
        ))
      )}

      <button className="btn btn-dashed card-size" style={{ marginTop: 12 }} onClick={() => setPicking(true)}>
        <Plus />
        {t("routine.addExercise")}
      </button>

      <div className="sticky-cta">
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? t("common.saving") : t("routine.save")}
        </button>
      </div>

      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={(ex) => {
            setItems((prev) => [...prev, { exerciseId: ex.id, name: ex.name, image: ex.images?.[0] ?? null, sets: 3 }]);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}
