import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteFoodEntry, updateFoodEntry } from "../../api/macros";
import { useApp } from "../../lib/appData";
import { useLang } from "../../lib/langHooks";
import { parseNum } from "../../lib/locale";
import { mealLabel } from "../../lib/mealNames";
import { ErrorBanner, Sheet, errText, useConfirm } from "../../components/ui";
import type { FoodEntry } from "../../types/macros";

/** Edit or delete one diary entry. */
export function EntrySheet({ entry, onClose }: { entry: FoodEntry; onClose: () => void }) {
  const { t, lang } = useLang();
  const { meals, bump, toast } = useApp();
  const [name, setName] = useState(entry.food_name);
  const [mealId, setMealId] = useState(entry.meal_id);
  const [kcal, setKcal] = useState(String(entry.calories ?? ""));
  const [p, setP] = useState(String(entry.protein ?? ""));
  const [c, setC] = useState(String(entry.carbs ?? ""));
  const [fat, setFat] = useState(String(entry.fat ?? ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmNode, ask] = useConfirm();

  const num = (s: string) => {
    const n = parseNum(s);
    return Number.isFinite(n) ? n : null;
  };

  const save = async () => {
    if (!name.trim()) return setError(t("quick.needName"));
    setBusy(true);
    setError(null);
    try {
      await updateFoodEntry(entry.id, {
        meal_id: mealId,
        food_name: name.trim(),
        calories: num(kcal) === null ? null : Math.round(num(kcal)!),
        protein: num(p),
        carbs: num(c),
        fat: num(fat),
      });
      bump("diary");
      toast(t("common.saved"));
      onClose();
    } catch (e) {
      setError(errText(e, t));
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = await ask({
      title: t("entry.confirmDelete"),
      confirm: t("common.delete"),
      cancel: t("common.cancel"),
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await deleteFoodEntry(entry.id);
      bump("diary");
      toast(t("entry.deleted"));
      onClose();
    } catch (e) {
      setError(errText(e, t));
      setBusy(false);
    }
  };

  return (
    <Sheet onClose={onClose} title={t("entry.title")}>
      <ErrorBanner message={error} onClose={() => setError(null)} />
      <label className="field">
        <span>{t("quick.name")}</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="field">
        <span>{t("entry.meal")}</span>
        <select className="input" value={mealId} onChange={(e) => setMealId(Number(e.target.value))}>
          {meals.map((m) => (
            <option key={m.id} value={m.id}>
              {mealLabel(m.name, lang)}
            </option>
          ))}
        </select>
      </label>
      <div className="field">
        <span>{t("portion.calories")}</span>
        <div className="input-wrap">
          <input className="input" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} />
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
      <div style={{ marginTop: 18 }}>
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? t("common.saving") : t("common.save")}
        </button>
        <button className="btn btn-danger" onClick={remove} disabled={busy}>
          <Trash2 />
          {t("common.delete")}
        </button>
      </div>
      {confirmNode}
    </Sheet>
  );
}

export function MacroInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="field" style={{ marginTop: 0 }}>
      <span>{label}</span>
      <div className="input-wrap">
        <input className="input" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
        <span className="unit">g</span>
      </div>
    </label>
  );
}
