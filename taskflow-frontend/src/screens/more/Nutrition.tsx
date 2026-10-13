import { Flame, Salad, Target, User, Utensils } from "lucide-react";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { useFmt } from "../../lib/useFmt";
import { mealLabel } from "../../lib/mealNames";
import { EmptyState, ITile, Info, ScreenHeader } from "../../components/ui";
import { ProfileEdit } from "./ProfileEdit";
import { Goals } from "./Goals";
import { MealsScreen } from "./Meals";

/** "Nutrição" — the calorie and macro targets, and how they split across meals. */
export function Nutrition() {
  const { t, lang } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { profile, meals } = useApp();
  const kcal = profile.target_calories ?? 0;
  const p = Number(profile.target_protein_g ?? 0);
  const c = Number(profile.target_carbs_g ?? 0);
  const fat = Number(profile.target_fat_g ?? 0);
  const kcalFrom = { p: p * 4, c: c * 4, f: fat * 9 };
  const sum = kcalFrom.p + kcalFrom.c + kcalFrom.f || 1;
  const pct = (x: number) => Math.round((x / sum) * 100);
  const perKg = (g: number) => f.num(g / Number(profile.weight_kg || 1), 1);
  const mealSum = meals.reduce((a, m) => a + (m.target_calories ?? 0), 0);

  return (
    <div className="page bare">
      <ScreenHeader title={t("nutrition.title")} subtitle={t("nutrition.subtitle")} onBack={nav.pop} backLabel={t("common.back")} />

      {kcal === 0 ? (
        <EmptyState icon={Salad} title={t("home.noGoal")} />
      ) : (
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
            <span className="card-title" style={{ fontSize: 14, display: "block", marginTop: 6 }}>
              {t("nutrition.split")}
            </span>
            <div className="split-bar" role="img" aria-label={t("nutrition.split")}>
              <i style={{ width: `${pct(kcalFrom.p)}%`, background: "var(--p)" }} />
              <i style={{ width: `${pct(kcalFrom.c)}%`, background: "var(--c)" }} />
              <i style={{ width: `${pct(kcalFrom.f)}%`, background: "var(--f)" }} />
            </div>
            <div className="split-legend">
              <span>
                <i className="mdot" style={{ background: "var(--p)" }} /> {t("home.protein")} {pct(kcalFrom.p)}%
              </span>
              <span>
                <i className="mdot" style={{ background: "var(--c)" }} /> {t("home.carbs")} {pct(kcalFrom.c)}%
              </span>
              <span>
                <i className="mdot" style={{ background: "var(--f)" }} /> {t("home.fat")} {pct(kcalFrom.f)}%
              </span>
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
            {mealSum > 0 && (
              <p className="muted tnum" style={{ fontSize: 13, marginTop: 10 }}>
                {t("meals.sumHint", { n: f.kcal(mealSum), t: f.kcal(kcal) })}
              </p>
            )}
          </section>
        </>
      )}

      <Info>{t("nutrition.calculated")}</Info>
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
