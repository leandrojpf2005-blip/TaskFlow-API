import { useEffect, useMemo, useState } from "react";
import { getDay } from "../api/macros";
import { getMeals } from "../api/meals";
import { todayISO } from "../lib/date";
import { sumEntries, type Totals } from "../lib/totals";
import { round1 } from "../lib/format";
import { MacroRing } from "../components/MacroRing";
import { useT } from "../lib/langHooks";
import type { Translate } from "../lib/i18n";
import type { Meal, FoodEntry } from "../types/macros";
import type { Profile } from "../types/profile";
import type { User } from "../api/auth";

// Home = today at a glance: the calorie ring, the three macro bars, and the
// day's meals. Totals are summed from the entries the diary already returns,
// so this screen needs no aggregate endpoint of its own.

export function Home({ user, profile }: { user: User; profile: Profile }) {
  const t = useT();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getDay(todayISO()), getMeals()])
      .then(([day, m]) => {
        if (cancelled) return;
        setEntries(day);
        setMeals(m);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totals: Totals = useMemo(() => sumEntries(entries), [entries]);

  const byMeal = useMemo(() => {
    const map = new Map<number, FoodEntry[]>();
    for (const e of entries) {
      const list = map.get(e.meal_id);
      if (list) list.push(e);
      else map.set(e.meal_id, [e]);
    }
    return map;
  }, [entries]);

  const goal = profile.target_calories ?? 0;
  const eaten = Math.round(totals.calories);
  const remaining = goal - eaten;

  return (
    <div className="pad">
      <header className="screen-head">
        <div>
          <p className="sub">{t("home.greeting")}</p>
          <h1>{user.username}</h1>
        </div>
        <div className="avatar">{user.username.charAt(0).toUpperCase()}</div>
      </header>

      <section className="card">
        <div className="card-head">
          <b>{t("home.dailyCalories")}</b>
        </div>

        {goal === 0 ? (
          <p className="empty">{t("home.setGoal")}</p>
        ) : (
          <div className="calorie-row">
            <MacroRing
              value={eaten}
              target={goal}
              size={142}
              stroke={13}
              color="var(--accent)"
              center={
                <>
                  <small>{remaining >= 0 ? t("home.remaining") : t("home.over")}</small>
                  <b>{loading ? "…" : Math.abs(remaining).toLocaleString()}</b>
                  <small>{t("home.kcalLeft")}</small>
                </>
              }
            />
            <div className="legend">
              <LegendRow label={t("home.eaten")} value={eaten} unit="kcal" dot="var(--accent)" />
              <LegendRow label={t("home.goal")} value={goal} unit="kcal" dot="var(--track)" />
            </div>
          </div>
        )}
      </section>

      <h2 className="section-title">{t("home.macros")}</h2>
      <div className="macro-grid">
        <MacroCard
          label={t("home.protein")}
          value={totals.protein}
          target={profile.target_protein_g ?? 0}
          color="var(--p-color)"
          track="var(--p-track)"
          t={t}
        />
        <MacroCard
          label={t("home.carbs")}
          value={totals.carbs}
          target={profile.target_carbs_g ?? 0}
          color="var(--c-color)"
          track="var(--c-track)"
          t={t}
        />
        <MacroCard
          label={t("home.fat")}
          value={totals.fat}
          target={profile.target_fat_g ?? 0}
          color="var(--f-color)"
          track="var(--f-track)"
          t={t}
        />
      </div>

      <h2 className="section-title">{t("home.meals")}</h2>
      {meals.length === 0 ? (
        <p className="empty">{t("home.noMeals")}</p>
      ) : (
        meals.map((meal) => {
          const items = byMeal.get(meal.id) ?? [];
          const kcal = Math.round(sumEntries(items).calories);
          const target = meal.target_calories ?? 0;
          const over = target > 0 && kcal > target;
          return (
            <section className="card meal-card" key={meal.id}>
              <div className="card-head">
                <div className="meal-head">
                  <span className="meal-badge">{meal.name.charAt(0).toUpperCase()}</span>
                  <div>
                    <b>{meal.name}</b>
                    <p className="muted small">
                      {kcal}
                      {target > 0 ? ` / ${target}` : ""} kcal
                    </p>
                  </div>
                </div>
              </div>

              {target > 0 && (
                <div className="bar">
                  <span
                    className={over ? "over" : ""}
                    style={{ width: `${Math.min(100, (kcal / target) * 100)}%` }}
                  />
                </div>
              )}

              {items.length === 0 ? (
                <p className="meal-empty">—</p>
              ) : (
                <ul className="entry-list">
                  {items.map((e) => (
                    <li key={e.id}>
                      <div className="entry-main">
                        <strong>{e.food_name}</strong>
                        <p className="macro-dots">
                          <Dot color="var(--p-color)" /> {round1(e.protein ?? 0)}g
                          <Dot color="var(--c-color)" /> {round1(e.carbs ?? 0)}g
                          <Dot color="var(--f-color)" /> {round1(e.fat ?? 0)}g
                        </p>
                      </div>
                      <div className="entry-kcal">
                        <b>{Math.round(e.calories ?? 0)}</b>
                        <small>kcal</small>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

function LegendRow({
  label,
  value,
  unit,
  dot,
}: {
  label: string;
  value: number;
  unit: string;
  dot: string;
}) {
  return (
    <div className="legend-row">
      <span className="legend-dot" style={{ background: dot }} />
      <div>
        <p className="muted small">{label}</p>
        <b>
          {value.toLocaleString()} <small>{unit}</small>
        </b>
      </div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <i className="mdot" style={{ background: color }} />;
}

function MacroCard({
  label,
  value,
  target,
  color,
  track,
  t,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
  track: string;
  t: Translate;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const left = Math.max(0, Math.round(target - value));
  return (
    <div className="macro-card">
      <p className="macro-label">
        <i className="mdot" style={{ background: color }} /> {label}
      </p>
      <p className="macro-value">
        {round1(value)}
        <span>/{target}g</span>
      </p>
      <div className="bar" style={{ background: track }}>
        <span style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="macro-left">{t("home.left", { n: left })}</p>
    </div>
  );
}
