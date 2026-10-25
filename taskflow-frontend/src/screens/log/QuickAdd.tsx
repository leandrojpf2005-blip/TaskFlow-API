import { useState } from "react";
import { ChevronDown, Flame, Utensils } from "lucide-react";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { parseNum } from "../../lib/locale";
import { logFood, mealForNow } from "../../lib/logFood";
import { mealLabel } from "../../lib/mealNames";
import { ErrorBanner, ITile, ScreenHeader, errText } from "../../components/ui";
import { MacroInput } from "./EntrySheet";

/** "Adição rápida" — log calories and macros without searching. */
export function QuickAdd({ mealId: initialMealId, initialName = "" }: { mealId?: number; initialName?: string }) {
  const { t, lang } = useLang();
  const nav = useNav();
  const { meals, date, bump, toast } = useApp();
  const [name, setName] = useState(initialName);
  const [kcal, setKcal] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [fat, setFat] = useState("");
  const [mealId, setMealId] = useState(initialMealId ?? mealForNow(meals)?.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meal = meals.find((m) => m.id === mealId);
  const n = (s: string) => {
    const v = parseNum(s);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  };

  const add = async () => {
    const calories = parseNum(kcal);
    if (!Number.isFinite(calories) || calories < 0) return setError(t("quick.needCalories"));
    if (!meal) return setError(t("portion.needMeal"));
    setBusy(true);
    setError(null);
    try {
      await logFood(
        {
          key: "quick",
          name: name.trim() || t("quick.defaultName"),
          basis: "serving",
          calories,
          protein: n(p),
          carbs: n(c),
          fat: n(fat),
        },
        1,
        meal.id,
        date,
      );
      bump("diary");
      toast(t("add.added", { meal: mealLabel(meal.name, lang) }));
      nav.goTab("home");
    } catch (e) {
      setError(errText(e, t));
      setBusy(false);
    }
  };

  return (
    <div className="page bare">
      <ScreenHeader title={t("quick.title")} subtitle={t("quick.subtitle")} onBack={nav.pop} backLabel={t("common.back")} />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      <section className="card">
        <label className="field">
          <span>{t("quick.name")}</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("quick.namePlaceholder")}
          />
        </label>
        <div className="field">
          <span>{t("portion.calories")}</span>
          <div className="input-wrap">
            <Flame />
            <input
              className="input"
              inputMode="numeric"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
              placeholder="0"
              autoFocus
            />
            <span className="unit">kcal</span>
          </div>
        </div>
        <div className="field">
          <div className="input-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <MacroInput label={t("home.protein")} value={p} onChange={setP} />
            <MacroInput label={t("home.carbs")} value={c} onChange={setC} />
            <MacroInput label={t("home.fat")} value={fat} onChange={setFat} />
          </div>
        </div>
      </section>

      <p className="label-out">{t("portion.addTo")}</p>
      <label className="card select-card">
        <ITile icon={Utensils} size="sm" />
        <span className="grow">
          <b>{meal ? mealLabel(meal.name, lang) : "—"}</b>
        </span>
        <ChevronDown />
        <select value={mealId ?? ""} onChange={(e) => setMealId(Number(e.target.value))} aria-label={t("portion.addTo")}>
          {meals.map((x) => (
            <option key={x.id} value={x.id}>
              {mealLabel(x.name, lang)}
            </option>
          ))}
        </select>
      </label>

      <div className="sticky-cta">
        <button className="btn btn-primary" onClick={add} disabled={busy}>
          {busy ? t("common.saving") : t("portion.addToDiary")}
        </button>
      </div>
    </div>
  );
}
