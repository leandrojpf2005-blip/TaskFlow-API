import { useState } from "react";
import { Sparkles } from "lucide-react";
import { saveProfile } from "../api/profile";
import * as mealsApi from "../api/meals";
import { useLang } from "../lib/langHooks";
import { parseNum } from "../lib/locale";
import { usePrefs } from "../lib/prefs";
import { toCm, toKg } from "../lib/units";
import { ErrorBanner, ITile, errText } from "../components/ui";
import { BodyForm, type BodyValues } from "./more/BodyForm";
import type { Profile } from "../types/profile";

// Stored in English; the UI translates these defaults for display, so the
// names follow the user if they switch language later.
const DEFAULT_MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks"];
const MEAL_SHARE = [0.25, 0.35, 0.3, 0.1];
const PACES = [
  { key: "lose", value: -0.5 },
  { key: "maintain", value: 0 },
  { key: "gain", value: 0.25 },
] as const;

/** First run after sign-up: body data → calorie plan → default meals. */
export function Onboarding({ username, onDone }: { username: string; onDone: (p: Profile) => void }) {
  const { t } = useLang();
  const { prefs } = usePrefs();
  const [v, setV] = useState<BodyValues>({ weight: "", height: "", age: "", sex: "male", activity: "moderate" });
  const [pace, setPace] = useState(-0.5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const w = parseNum(v.weight);
    const h = parseNum(v.height);
    const a = parseNum(v.age);
    if (!(w > 0 && h > 0 && a >= 10 && a < 120)) return setError(t("profile.invalid"));
    setBusy(true);
    setError(null);
    try {
      const p = await saveProfile({
        weight_kg: Math.round(toKg(w, prefs.weightUnit) * 10) / 10,
        height_cm: Math.round(toCm(h, prefs.lengthUnit) * 10) / 10,
        age: Math.round(a),
        sex: v.sex,
        activity: v.activity,
        weekly_change_kg: pace,
      });
      // Seed meals so the diary is usable straight away (a new account has none).
      const kcal = p.target_calories ?? 2000;
      for (let i = 0; i < DEFAULT_MEALS.length; i++) {
        try {
          await mealsApi.createMeal({
            name: DEFAULT_MEALS[i],
            position: i + 1,
            target_calories: Math.round((kcal * MEAL_SHARE[i]) / 10) * 10,
          });
        } catch {
          /* non-fatal: meals can be added later from More → Meals */
        }
      }
      onDone(p);
    } catch (e) {
      setError(errText(e, t));
      setBusy(false);
    }
  };

  return (
    <div className="app">
      <div className="page bare">
        <div className="auth-brand" style={{ marginTop: 18 }}>
          <ITile icon={Sparkles} tone="solid" size="lg" round />
          <h1>{t("onboarding.title", { name: username })}</h1>
          <p>{t("onboarding.subtitle")}</p>
        </div>
        <ErrorBanner message={error} onClose={() => setError(null)} />
        <section className="card">
          <BodyForm v={v} onChange={(p) => setV((prev) => ({ ...prev, ...p }))} />
        </section>
        <section className="card">
          <span className="card-title">{t("goals.pace")}</span>
          <div className="seg-choice" style={{ marginTop: 10, gridTemplateColumns: "repeat(3, 1fr)" }}>
            {PACES.map((p) => (
              <button key={p.key} className={pace === p.value ? "on" : ""} onClick={() => setPace(p.value)}>
                {t(`goals.pace.${p.key}`)}
              </button>
            ))}
          </div>
        </section>
        <div className="sticky-cta">
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? t("auth.working") : t("onboarding.start")}
          </button>
        </div>
      </div>
    </div>
  );
}
