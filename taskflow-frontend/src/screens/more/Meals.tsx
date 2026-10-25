import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Scale, Trash2 } from "lucide-react";
import * as mealsApi from "../../api/meals";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { useFmt } from "../../lib/useFmt";
import { parseNum } from "../../lib/locale";
import { mealLabel } from "../../lib/mealNames";
import { ErrorBanner, ScreenHeader, errText, useConfirm } from "../../components/ui";

interface Row {
  id: number | null; // null = not created yet
  name: string;
  kcal: string;
}

/** "Refeições" — rename, reorder, set calorie limits, add and remove meals. */
export function MealsScreen() {
  const { t, lang } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { meals, profile, reloadMeals, bump, toast } = useApp();
  // Default names are shown translated; save() keeps the stored name unless it was edited.
  const [rows, setRows] = useState<Row[]>(() =>
    meals.map((m) => ({ id: m.id, name: mealLabel(m.name, lang), kcal: m.target_calories ? String(m.target_calories) : "" })),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmNode, ask] = useConfirm();

  const patch = (i: number, p: Partial<Row>) => setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const move = (i: number, dir: -1 | 1) =>
    setRows((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const goal = profile.target_calories ?? 0;
  const sum = rows.reduce((a, r) => a + (parseNum(r.kcal) || 0), 0);

  const distribute = () => {
    if (!goal || rows.length === 0) return;
    // Breakfast/lunch/dinner-heavy split for the common 3–5 meal layouts.
    const weights = rows.length === 4 ? [0.25, 0.35, 0.1, 0.3] : rows.length === 3 ? [0.3, 0.4, 0.3] : rows.map(() => 1 / rows.length);
    setRows((prev) => prev.map((r, i) => ({ ...r, kcal: String(Math.round((goal * weights[i]) / 10) * 10) })));
  };

  const remove = async (i: number) => {
    const r = rows[i];
    if (r.id === null) return setRows((prev) => prev.filter((_, j) => j !== i));
    const ok = await ask({
      title: t("meals.confirmDeleteTitle", { name: r.name }),
      text: t("meals.confirmDelete"),
      confirm: t("common.delete"),
      cancel: t("common.cancel"),
      danger: true,
    });
    if (!ok) return;
    try {
      await mealsApi.deleteMeal(r.id);
      setRows((prev) => prev.filter((_, j) => j !== i));
      await reloadMeals();
      bump("diary");
    } catch (e) {
      setError(errText(e, t));
    }
  };

  const save = async () => {
    if (rows.some((r) => !r.name.trim())) return setError(t("meals.needName"));
    setBusy(true);
    setError(null);
    try {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const kcal = parseNum(r.kcal);
        const target = Number.isFinite(kcal) && kcal > 0 ? Math.round(kcal) : 0;
        const original = meals.find((m) => m.id === r.id);
        if (r.id === null) {
          await mealsApi.createMeal({ name: r.name.trim(), position: i + 1, target_calories: target });
        } else if (
          original &&
          (mealLabel(original.name, lang) !== r.name.trim() || original.position !== i + 1 || (original.target_calories ?? 0) !== target)
        ) {
          await mealsApi.updateMeal(r.id, {
            // Keep the stored default name untouched unless the user actually renamed it.
            name: mealLabel(original.name, lang) === r.name.trim() ? original.name : r.name.trim(),
            position: i + 1,
            target_calories: target,
          });
        }
      }
      await reloadMeals();
      bump("diary");
      toast(t("meals.saved"));
      nav.pop();
    } catch (e) {
      setError(errText(e, t));
      setBusy(false);
    }
  };

  return (
    <div className="page bare">
      <ScreenHeader title={t("meals.title")} subtitle={t("meals.subtitle")} onBack={nav.pop} backLabel={t("common.back")} />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      <section className="card">
        <div className="card-row" style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", padding: "0 2px" }}>
          <span>{t("meals.name")}</span>
          <span style={{ marginRight: 92 }}>{t("meals.kcalTarget")}</span>
        </div>
        {rows.map((r, i) => (
          <div className="meal-edit" key={r.id ?? `new-${i}`}>
            <div className="tools">
              <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={t("meals.moveUp")}>
                <ArrowUp />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={t("meals.moveDown")}>
                <ArrowDown />
              </button>
            </div>
            <input className="input name-in" value={r.name} onChange={(e) => patch(i, { name: e.target.value })} aria-label={t("meals.name")} />
            <input
              className="input kcal-in tnum"
              inputMode="numeric"
              value={r.kcal}
              onChange={(e) => patch(i, { kcal: e.target.value })}
              placeholder={t("meals.noTarget")}
              aria-label={t("meals.kcalTarget")}
            />
            <button className="icon-del" onClick={() => remove(i)} aria-label={t("common.delete")}>
              <Trash2 />
            </button>
          </div>
        ))}
        <button
          className="btn btn-dashed"
          style={{ marginTop: 8 }}
          onClick={() => setRows((prev) => [...prev, { id: null, name: "", kcal: "" }])}
        >
          <Plus />
          {t("meals.add")}
        </button>
      </section>

      {goal > 0 && (
        <section className="card">
          <div className="card-row">
            <span className="muted tnum" style={{ fontSize: 13.5 }}>
              {t("meals.sumHint", { n: f.kcal(sum), t: f.kcal(goal) })}
            </span>
            <button className="pill-btn" onClick={distribute}>
              <Scale />
              {t("meals.distribute")}
            </button>
          </div>
        </section>
      )}

      <div className="sticky-cta">
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? t("common.saving") : t("common.save")}
        </button>
      </div>
      {confirmNode}
    </div>
  );
}
