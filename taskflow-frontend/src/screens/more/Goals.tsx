import { useState } from "react";
import { Dumbbell, Minus, Plus, Target, TrendingDown, TrendingUp, Equal } from "lucide-react";
import { saveProfile } from "../../api/profile";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { usePrefs } from "../../lib/prefs";
import { useFmt } from "../../lib/useFmt";
import { parseNum } from "../../lib/locale";
import { kgTo, toKg } from "../../lib/units";
import { ErrorBanner, ITile, Info, ScreenHeader, errText } from "../../components/ui";

const PACES = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5];

/** "Objetivos" — goal weight, weekly pace (drives the calorie target), workouts per week. */
export function Goals() {
  const { t } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { profile, setProfile, toast } = useApp();
  const { prefs, setPrefs } = usePrefs();
  const goalSupported = "goal_weight_kg" in profile;
  const [pace, setPace] = useState(Number(profile.weekly_change_kg ?? 0));
  const [goal, setGoal] = useState(
    profile.goal_weight_kg != null ? String(Math.round(kgTo(profile.goal_weight_kg, prefs.weightUnit) * 10) / 10) : "",
  );
  const [workouts, setWorkouts] = useState(prefs.weeklyWorkoutGoal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const g = parseNum(goal);
    if (goalSupported && goal.trim() && !(g > 0)) return setError(t("profile.invalid"));
    setBusy(true);
    setError(null);
    try {
      setPrefs({ weeklyWorkoutGoal: workouts });
      const p = await saveProfile({
        weight_kg: Number(profile.weight_kg),
        height_cm: Number(profile.height_cm),
        age: profile.age,
        sex: profile.sex,
        activity: profile.activity,
        weekly_change_kg: pace,
        ...(goalSupported ? { goal_weight_kg: goal.trim() ? Math.round(toKg(g, prefs.weightUnit) * 10) / 10 : null } : {}),
      });
      setProfile(p);
      toast(t("goals.saved", { kcal: f.kcal(p.target_calories ?? 0) }));
      nav.pop();
    } catch (e) {
      setError(errText(e, t));
      setBusy(false);
    }
  };

  const direction = pace < 0 ? "lose" : pace > 0 ? "gain" : "maintain";

  return (
    <div className="page bare">
      <ScreenHeader title={t("goals.title")} subtitle={t("goals.subtitle")} onBack={nav.pop} backLabel={t("common.back")} />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      {goalSupported && (
        <section className="card">
          <div className="card-row" style={{ justifyContent: "flex-start", gap: 12, marginBottom: 12 }}>
            <ITile icon={Target} tone="coral" />
            <span className="card-title">{t("goals.goalWeight")}</span>
          </div>
          <div className="input-wrap">
            <input
              className="input"
              inputMode="decimal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={f.weight(Number(profile.weight_kg))}
              style={{ paddingLeft: 14 }}
            />
            <span className="unit">{prefs.weightUnit}</span>
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-row" style={{ justifyContent: "flex-start", gap: 12, marginBottom: 12 }}>
          <ITile icon={direction === "lose" ? TrendingDown : direction === "gain" ? TrendingUp : Equal} />
          <div>
            <span className="card-title">{t("goals.pace")}</span>
            <p className="muted" style={{ fontSize: 13 }}>
              {t(`goals.pace.${direction}`)} · {t("goals.perWeek", { w: `${f.weightSigned(pace, 2)} ${prefs.weightUnit}` })}
            </p>
          </div>
        </div>
        <div className="seg-choice" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          {PACES.map((p) => (
            <button key={p} className={pace === p ? "on" : ""} onClick={() => setPace(p)}>
              <span className="tnum">{p === 0 ? "0" : f.weightSigned(p, 2)}</span>
            </button>
          ))}
        </div>
        <Info>{t("goals.paceHint")}</Info>
      </section>

      <section className="card">
        <div className="card-row">
          <div className="card-row" style={{ justifyContent: "flex-start", gap: 12 }}>
            <ITile icon={Dumbbell} />
            <span className="card-title">{t("goals.workouts")}</span>
          </div>
          <div className="card-row" style={{ gap: 12 }}>
            <button className="round-btn sm" onClick={() => setWorkouts((w) => Math.max(1, w - 1))} aria-label="−">
              <Minus />
            </button>
            <b className="tnum" style={{ fontSize: 20, minWidth: 18, textAlign: "center" }}>
              {workouts}
            </b>
            <button className="round-btn sm" onClick={() => setWorkouts((w) => Math.min(7, w + 1))} aria-label="+">
              <Plus />
            </button>
          </div>
        </div>
      </section>

      <div className="sticky-cta">
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? t("common.saving") : t("goals.save")}
        </button>
      </div>
    </div>
  );
}
