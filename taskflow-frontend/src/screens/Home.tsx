import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronLeft, ChevronRight, Flame, Plus, Sparkles, UtensilsCrossed } from "lucide-react";
import { getDay } from "../api/macros";
import { getStreak, type Streak } from "../api/stats";
import { useApp } from "../lib/appData";
import { useNav } from "../lib/nav";
import { useLang } from "../lib/langHooks";
import { useFmt } from "../lib/useFmt";
import { addDays, parseDay, todayIso } from "../lib/dates";
import { mealLabel } from "../lib/mealNames";
import { EmptyState, LetterBadge, MacroDots, PBar, Ring, SectionHead } from "../components/ui";
import { EntrySheet } from "./log/EntrySheet";
import { FoodSearch } from "./log/FoodSearch";
import { Nutrition } from "./more/Nutrition";
import { MealsScreen } from "./more/Meals";
import { NotificationsSheet } from "./more/PickSheets";
import type { FoodEntry } from "../types/macros";

const MEAL_TONES = ["green", "green", "coral", "coral"] as const;

export function Home() {
  const { t, lang } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { user, profile, meals, date, setDate, version } = useApp();
  // Keyed by what was fetched, so a stale day never shows under a new date.
  const [loaded, setLoaded] = useState<{ key: string; entries: FoodEntry[] } | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [bellOpen, setBellOpen] = useState(false);

  const today = todayIso();

  const dayKey = `${date}|${version.diary}`;
  const entries = loaded?.key === dayKey ? loaded.entries : null;

  useEffect(() => {
    let live = true;
    getDay(date)
      .then((e) => live && setLoaded({ key: dayKey, entries: e }))
      .catch(() => live && setLoaded({ key: dayKey, entries: [] }));
    return () => {
      live = false;
    };
  }, [date, dayKey]);

  useEffect(() => {
    let live = true;
    getStreak().then((s) => live && setStreak(s));
    return () => {
      live = false;
    };
  }, [version.diary, version.workouts]);

  const totals = useMemo(() => {
    const sum = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const e of entries ?? []) {
      sum.calories += e.calories ?? 0;
      sum.protein += Number(e.protein ?? 0);
      sum.carbs += Number(e.carbs ?? 0);
      sum.fat += Number(e.fat ?? 0);
    }
    return sum;
  }, [entries]);

  const byMeal = useMemo(() => {
    const m = new Map<number, FoodEntry[]>();
    for (const e of entries ?? []) m.set(e.meal_id, [...(m.get(e.meal_id) ?? []), e]);
    return m;
  }, [entries]);

  const goal = profile.target_calories ?? 0;
  const eaten = Math.round(totals.calories);
  const remaining = goal - eaten;
  const pct = goal > 0 ? Math.round((eaten / goal) * 100) : 0;
  const nextMeal = meals.find((m) => !(byMeal.get(m.id)?.length ?? 0));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("home.goodMorning") : hour < 19 ? t("home.goodAfternoon") : t("home.goodEvening");

  // Seven-day strip: the selected day sits second from the right, with the
  // following day after it (dashed when it is still in the future).
  const anchor = date < today ? date : today;
  const strip = Array.from({ length: 7 }, (_, i) => addDays(anchor, i - 5));
  const sel = parseDay(date);
  const dayTitle =
    date === today ? t("common.today") : date === addDays(today, -1) ? t("common.yesterday") : f.date(sel, { weekday: "long" });
  const daySub = `${f.weekdayShort(sel)}, ${f.dayMonth(sel)}`;

  const openFood = (mealId?: number) =>
    nav.push(<FoodSearch mealId={mealId ?? nextMeal?.id ?? meals[0]?.id} />, "tabs");

  let insight: { text: string; coral?: boolean } | null = null;
  if (goal > 0) {
    if (eaten === 0) insight = { text: t("home.insight.start") };
    else if (eaten > goal) insight = { text: t("home.insight.over", { n: f.kcal(eaten - goal) }), coral: true };
    else if (pct >= 95) insight = { text: t("home.insight.done") };
    else if (nextMeal)
      insight = { text: t("home.insight.onTrackFor", { pct, meal: mealLabel(nextMeal.name, lang).toLowerCase() }) };
    else insight = { text: t("home.insight.onTrack", { pct }) };
  }

  const proteinLeft = (profile.target_protein_g ?? 0) - totals.protein;
  let tip: { title: string; hint: string } | null = null;
  if (goal > 0 && date === today && entries) {
    if (proteinLeft >= 10) tip = { title: t("home.tip.protein", { n: f.num(proteinLeft) }), hint: t("home.tip.proteinHint") };
    else if (remaining > 150) tip = { title: t("home.tip.kcal", { n: f.kcal(remaining) }), hint: t("home.tip.kcalHint") };
    else tip = { title: t("home.tip.done"), hint: t("home.tip.doneHint") };
  }

  return (
    <div className="page">
      <header className="home-head">
        <span className="avatar">{user.username.charAt(0)}</span>
        <div className="who">
          <small>{greeting}</small>
          <b>{user.username}</b>
        </div>
        {streak && streak.current > 0 && (
          <span className="streak" title={t("home.streakDays", { n: streak.current })}>
            <Flame />
            {streak.current}
          </span>
        )}
        <button className="round-btn" onClick={() => setBellOpen(true)} aria-label={t("more.notifications")}>
          <Bell />
        </button>
      </header>

      <section className="card datecard">
        <button className="nav" onClick={() => setDate(addDays(date, -1))} aria-label={t("common.previousDay")}>
          <ChevronLeft />
        </button>
        <div className="mid">
          <b>{dayTitle}</b>
          <small>{daySub}</small>
        </div>
        <button
          className="nav"
          onClick={() => setDate(addDays(date, 1))}
          disabled={date >= today}
          aria-label={t("common.nextDay")}
        >
          <ChevronRight />
        </button>
      </section>

      <div className="daystrip">
        {strip.map((d) => {
          const dd = parseDay(d);
          const future = d > today;
          return (
            <button
              key={d}
              className={`${d === date ? "on" : ""}${future ? " future" : ""}`}
              onClick={() => !future && setDate(d)}
              disabled={future}
              aria-pressed={d === date}
              aria-label={f.date(dd, { weekday: "long", day: "numeric", month: "long" })}
            >
              {f.date(dd, { weekday: "narrow" })}
              <b className="tnum">{dd.getDate()}</b>
            </button>
          );
        })}
      </div>

      <section className="card">
        <div className="card-row">
          <span className="card-title">{t("home.dailyCalories")}</span>
          <button className="link" onClick={() => nav.push(<Nutrition />)}>
            {t("home.editGoal")}
          </button>
        </div>

        {goal === 0 ? (
          <EmptyState icon={Sparkles} title={t("home.noGoal")} />
        ) : (
          <div className="cal-body">
            <Ring value={eaten} max={goal} size={164} stroke={16}>
              <small>{remaining >= 0 ? t("home.remaining") : t("home.over")}</small>
              <b className="tnum">{entries ? f.kcal(Math.abs(remaining)) : "…"}</b>
              <small>{remaining >= 0 ? t("home.kcalLeft") : t("home.kcalOver")}</small>
            </Ring>
            <div className="cal-side">
              <div className="legend-tile">
                <span className="sw">
                  <i />
                </span>
                <div>
                  <small>{t("home.eaten")}</small>
                  <b className="tnum">
                    {f.kcal(eaten)}
                    <small>kcal</small>
                  </b>
                </div>
              </div>
              <div className="legend-tile">
                <span className="sw grey">
                  <i />
                </span>
                <div>
                  <small>{t("home.dailyGoal")}</small>
                  <b className="tnum">
                    {f.kcal(goal)}
                    <small>kcal</small>
                  </b>
                </div>
              </div>
              {insight && <div className={`insight-box${insight.coral ? " coral" : ""}`}>{insight.text}</div>}
            </div>
          </div>
        )}
      </section>

      <SectionHead
        title={t("home.macros")}
        action={
          <button className="link" onClick={() => nav.push(<Nutrition />)}>
            {t("home.details")}
          </button>
        }
      />
      <div className="mcards">
        <MacroCard name={t("home.protein")} value={totals.protein} target={profile.target_protein_g ?? 0} color="var(--p)" track="var(--p-soft)" />
        <MacroCard name={t("home.carbs")} value={totals.carbs} target={profile.target_carbs_g ?? 0} color="var(--c)" track="var(--c-soft)" />
        <MacroCard name={t("home.fat")} value={totals.fat} target={profile.target_fat_g ?? 0} color="var(--f)" track="var(--f-soft)" />
      </div>

      <SectionHead title={t("home.meals")} />
      {meals.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={t("home.noMeals")}
          action={
            <button className="btn btn-primary" onClick={() => nav.push(<MealsScreen />)}>
              {t("home.setupMeals")}
            </button>
          }
        />
      ) : (
        meals.map((meal, i) => {
          const items = byMeal.get(meal.id) ?? [];
          const kcal = items.reduce((a, e) => a + (e.calories ?? 0), 0);
          const target = meal.target_calories ?? 0;
          const tone = MEAL_TONES[i % MEAL_TONES.length];
          const label = mealLabel(meal.name, lang);
          return (
            <section className="card meal-card" key={meal.id}>
              <div className="meal-top">
                <LetterBadge text={label} tone={tone} />
                <div className="grow">
                  <b>{label}</b>
                  <small className="tnum">
                    {target > 0 ? `${f.kcal(kcal)} / ${f.kcal(target)} kcal` : `${f.kcal(kcal)} kcal`}
                  </small>
                </div>
                <button className="pill-btn" onClick={() => openFood(meal.id)}>
                  <Plus />
                  {t("home.addFood")}
                </button>
              </div>
              {target > 0 && (
                <PBar value={kcal} max={target} thin color={tone === "coral" || kcal > target ? "var(--coral)" : undefined} />
              )}
              {items.length === 0 ? (
                <div className="meal-empty">{t("home.noEntries")}</div>
              ) : (
                <ul className="entries">
                  {items.map((e) => (
                    <li key={e.id}>
                      <button className="entry" onClick={() => setEditing(e)}>
                        <LetterBadge text={e.food_name} />
                        <div className="grow">
                          <b>{e.food_name}</b>
                          <MacroDots
                            protein={Number(e.protein ?? 0)}
                            carbs={Number(e.carbs ?? 0)}
                            fat={Number(e.fat ?? 0)}
                            fmt={f.g}
                          />
                        </div>
                        <div className="kcal-col">
                          <b className="tnum">{f.kcal(e.calories ?? 0)}</b>
                          <small>kcal</small>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}

      {tip && (
        <button className="tipcard" onClick={() => openFood()}>
          <span className="itile glass">
            <Sparkles />
          </span>
          <div className="grow">
            <b>{tip.title}</b>
            <small>{tip.hint}</small>
          </div>
          <ChevronRight />
        </button>
      )}

      {editing && <EntrySheet entry={editing} onClose={() => setEditing(null)} />}
      {bellOpen && <NotificationsSheet onClose={() => setBellOpen(false)} />}
    </div>
  );
}

function MacroCard({
  name,
  value,
  target,
  color,
  track,
}: {
  name: string;
  value: number;
  target: number;
  color: string;
  track: string;
}) {
  const { t } = useLang();
  const f = useFmt();
  const left = target - value;
  return (
    <div className="mcard">
      <div className="name">
        <i className="mdot" style={{ background: color }} />
        {name}
      </div>
      <div className="val tnum">
        {f.num(value)}
        <small>/{f.num(target)}g</small>
      </div>
      <PBar value={value} max={target} thin color={color} track={track} />
      <div className="left">{left >= 0 ? t("home.gLeft", { n: f.num(left) }) : t("home.gOver", { n: f.num(-left) })}</div>
    </div>
  );
}
