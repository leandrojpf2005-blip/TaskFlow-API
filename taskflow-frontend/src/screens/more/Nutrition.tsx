import { useEffect, useState } from "react";
import { Flame, Salad, Sparkles, Target, User, Utensils, Wand2 } from "lucide-react";
import { getPlan, saveTargets, type Plan } from "../../api/profile";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { useFmt } from "../../lib/useFmt";
import { parseNum } from "../../lib/locale";
import { mealLabel } from "../../lib/mealNames";
import { EmptyState, ErrorBanner, ITile, Info, ScreenHeader, Stepper, errText } from "../../components/ui";
import { ProfileEdit } from "./ProfileEdit";
import { Goals } from "./Goals";
import { MealsScreen } from "./Meals";

type MacroKey = "p" | "c" | "f";
const KCAL_PER_G: Record<MacroKey, number> = { p: 4, c: 4, f: 9 };
const COLORS: Record<MacroKey, string> = { p: "var(--p)", c: "var(--c)", f: "var(--f)" };

/**
 * "Nutrição" — calorie and macro targets. They are the user's own numbers:
 * nothing recalculates them behind their back. The profile-based plan is
 * shown as a suggestion they can copy in.
 */
export function Nutrition() {
  const { t } = useLang();
  const nav = useNav();
  const { profile } = useApp();
  // undefined = loading, null = backend without manual targets yet.
  const [plan, setPlan] = useState<Plan | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    getPlan()
      .then((p) => live && setPlan(p))
      .catch(() => live && setPlan(null));
    return () => {
      live = false;
    };
  }, [profile]);

  return (
    <div className="page bare">
      <ScreenHeader title={t("nutrition.title")} subtitle={t("nutrition.subtitle")} onBack={nav.pop} backLabel={t("common.back")} />
      {plan === undefined ? (
        <p className="splash">{t("common.loading")}</p>
      ) : plan === null ? (
        <ReadOnlyTargets />
      ) : (
        <TargetsEditor plan={plan} />
      )}
      <MealSplit />
      <div style={{ marginTop: 14 }}>
        <button className="btn btn-secondary" onClick={() => nav.push(<ProfileEdit />)}>
          <User />
          {t("nutrition.editProfile")}
        </button>
        <button className="btn btn-secondary" onClick={() => nav.push(<Goals />)}>
          <Target />
          {t("nutrition.editPace")}
        </button>
      </div>
    </div>
  );
}

function TargetsEditor({ plan }: { plan: Plan }) {
  const { t } = useLang();
  const f = useFmt();
  const { profile, setProfile, toast } = useApp();
  const init = (n: number | null | undefined, frac = 0) => (n == null ? "" : f.editable(Number(n), frac));
  const [kcal, setKcal] = useState(() => init(profile.target_calories));
  const [g, setG] = useState<Record<MacroKey, string>>(() => ({
    p: init(profile.target_protein_g),
    c: init(profile.target_carbs_g),
    f: init(profile.target_fat_g),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const num = (s: string) => {
    const v = parseNum(s);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  };
  const kcalN = num(kcal);
  const grams = { p: num(g.p), c: num(g.c), f: num(g.f) };
  const fromMacros = grams.p * 4 + grams.c * 4 + grams.f * 9;
  const off = kcalN > 0 && Math.abs(fromMacros - kcalN) > 30;
  const pct = (k: MacroKey) => (fromMacros > 0 ? Math.round(((grams[k] * KCAL_PER_G[k]) / fromMacros) * 100) : 0);
  const weight = Number(profile.weight_kg) || 1;

  // Keep protein and fat, put whatever calories are left into carbs.
  const fitCarbs = () => {
    const carbs = Math.max(0, (kcalN - grams.p * 4 - grams.f * 9) / 4);
    setG((prev) => ({ ...prev, c: f.editable(carbs, 0) }));
  };

  const applySuggestion = () => {
    setKcal(f.editable(plan.calories, 0));
    setG({ p: f.editable(plan.protein_g, 0), c: f.editable(plan.carbs_g, 0), f: f.editable(plan.fat_g, 0) });
  };

  const save = async () => {
    if (!(kcalN >= 800 && kcalN <= 8000)) return setError(t("nutrition.kcalRange"));
    setBusy(true);
    setError(null);
    try {
      const p = await saveTargets({
        target_calories: Math.round(kcalN),
        target_protein_g: Math.round(grams.p * 10) / 10,
        target_carbs_g: Math.round(grams.c * 10) / 10,
        target_fat_g: Math.round(grams.f * 10) / 10,
      });
      setProfile(p);
      toast(t("nutrition.saved"));
    } catch (e) {
      setError(errText(e, t));
    } finally {
      setBusy(false);
    }
  };

  const differsFromPlan =
    Math.round(kcalN) !== Math.round(plan.calories) ||
    Math.round(grams.p) !== Math.round(plan.protein_g) ||
    Math.round(grams.c) !== Math.round(plan.carbs_g) ||
    Math.round(grams.f) !== Math.round(plan.fat_g);

  return (
    <>
      <ErrorBanner message={error} onClose={() => setError(null)} />
      <section className="card">
        <div className="card-row">
          <span className="card-title">{t("nutrition.daily")}</span>
          <ITile icon={Flame} tone="solid" size="sm" />
        </div>
        <Stepper
          value={kcal}
          onChange={setKcal}
          onStep={(dir) => setKcal(f.editable(Math.max(0, Math.round((kcalN + dir * 50) / 50) * 50), 0))}
          unit="kcal"
          label={t("nutrition.daily")}
        />

        <div className="target-table">
          {(["p", "c", "f"] as MacroKey[]).map((k) => (
            <div className="target-row" key={k}>
              <i className="mdot" style={{ background: COLORS[k], width: 10, height: 10 }} />
              <div className="grow">
                <b>{t(k === "p" ? "home.protein" : k === "c" ? "home.carbs" : "home.fat")}</b>
                <small className="tnum">
                  {pct(k)}% · {t("nutrition.perKg", { n: f.num(grams[k] / weight, 1) })}
                </small>
              </div>
              <div className="input-wrap" style={{ width: 104 }}>
                <input
                  className="input tnum"
                  inputMode="decimal"
                  value={g[k]}
                  onChange={(e) => setG((prev) => ({ ...prev, [k]: e.target.value }))}
                  style={{ height: 44, paddingLeft: 12, paddingRight: 28, textAlign: "right" }}
                  aria-label={t(k === "p" ? "home.protein" : k === "c" ? "home.carbs" : "home.fat")}
                />
                <span className="unit">g</span>
              </div>
            </div>
          ))}
        </div>

        <div className="split-bar" role="img" aria-label={t("nutrition.split")}>
          {(["p", "c", "f"] as MacroKey[]).map((k) => (
            <i key={k} style={{ width: `${pct(k)}%`, background: COLORS[k] }} />
          ))}
        </div>
        <div className={`insight-box${off ? " coral" : ""}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ flex: 1 }} className="tnum">
            {off
              ? t("nutrition.mismatch", { n: f.kcal(fromMacros), t: f.kcal(kcalN) })
              : t("nutrition.matches", { n: f.kcal(fromMacros) })}
          </span>
          {off && (
            <button className="pill-btn" onClick={fitCarbs}>
              <Wand2 />
              {t("nutrition.fitCarbs")}
            </button>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-row" style={{ alignItems: "center" }}>
          <ITile icon={Sparkles} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ display: "block", fontSize: 15 }}>{t("nutrition.suggestion")}</b>
            <small className="muted tnum" style={{ fontSize: 12.5 }}>
              {f.kcal(plan.calories)} kcal · {f.num(plan.protein_g)} g {t("recipes.prot")} · {f.num(plan.carbs_g)} g{" "}
              {t("recipes.carb")} · {f.num(plan.fat_g)} g {t("recipes.fat")}
            </small>
          </div>
          <button className="pill-btn" onClick={applySuggestion} disabled={!differsFromPlan}>
            {t("nutrition.useSuggestion")}
          </button>
        </div>
      </section>

      <Info>{t("nutrition.manualHint")}</Info>

      <div className="sticky-cta">
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? t("common.saving") : t("nutrition.save")}
        </button>
      </div>
    </>
  );
}

/** Fallback while the backend still recalculates targets from the profile. */
function ReadOnlyTargets() {
  const { t } = useLang();
  const f = useFmt();
  const { profile } = useApp();
  const kcal = profile.target_calories ?? 0;
  const p = Number(profile.target_protein_g ?? 0);
  const c = Number(profile.target_carbs_g ?? 0);
  const fat = Number(profile.target_fat_g ?? 0);
  const sum = p * 4 + c * 4 + fat * 9 || 1;
  const pct = (x: number) => Math.round((x / sum) * 100);
  const perKg = (grams: number) => f.num(grams / Number(profile.weight_kg || 1), 1);

  if (kcal === 0) return <EmptyState icon={Salad} title={t("home.noGoal")} />;
  return (
    <>
      <section className="card">
        <div className="big-weight">
          <div>
            <small>{t("nutrition.daily")}</small>
            <div className="num">
              <b className="tnum">{f.kcal(kcal)}</b>
              <span>kcal</span>
            </div>
          </div>
          <ITile icon={Flame} tone="solid" />
        </div>
        <div className="split-bar" role="img" aria-label={t("nutrition.split")}>
          <i style={{ width: `${pct(p * 4)}%`, background: "var(--p)" }} />
          <i style={{ width: `${pct(c * 4)}%`, background: "var(--c)" }} />
          <i style={{ width: `${pct(fat * 9)}%`, background: "var(--f)" }} />
        </div>
      </section>
      <section className="card target-table">
        {[
          { n: t("home.protein"), g: p, c: "var(--p)" },
          { n: t("home.carbs"), g: c, c: "var(--c)" },
          { n: t("home.fat"), g: fat, c: "var(--f)" },
        ].map((x) => (
          <div className="target-row" key={x.n}>
            <i className="mdot" style={{ background: x.c, width: 10, height: 10 }} />
            <div className="grow">
              <b>{x.n}</b>
              <small className="tnum">{t("nutrition.perKg", { n: perKg(x.g) })}</small>
            </div>
            <b className="tnum">{f.num(x.g)} g</b>
          </div>
        ))}
      </section>
      <Info>{t("nutrition.calculated")}</Info>
    </>
  );
}

function MealSplit() {
  const { t, lang } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { profile, meals } = useApp();
  const kcal = profile.target_calories ?? 0;
  const mealSum = meals.reduce((a, m) => a + (m.target_calories ?? 0), 0);
  return (
    <section className="card">
      <div className="card-row" style={{ marginBottom: 10 }}>
        <span className="card-title">{t("nutrition.perMeal")}</span>
        <button className="link" onClick={() => nav.push(<MealsScreen />)}>
          {t("common.edit")}
        </button>
      </div>
      <div className="target-table">
        {meals.map((m) => (
          <div className="target-row" key={m.id}>
            <ITile icon={Utensils} size="sm" />
            <div className="grow">
              <b>{mealLabel(m.name, lang)}</b>
            </div>
            <b className="tnum" style={{ fontSize: 15 }}>
              {m.target_calories ? `${f.kcal(m.target_calories)} kcal` : t("meals.noTarget")}
            </b>
          </div>
        ))}
      </div>
      {mealSum > 0 && kcal > 0 && (
        <p className="muted tnum" style={{ fontSize: 13, marginTop: 10 }}>
          {t("meals.sumHint", { n: f.kcal(mealSum), t: f.kcal(kcal) })}
        </p>
      )}
    </section>
  );
}
