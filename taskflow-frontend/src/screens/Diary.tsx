import { useEffect, useMemo, useState } from "react";
import * as macrosApi from "../api/macros";
import * as mealsApi from "../api/meals";
import { todayISO, addDays, isToday } from "../lib/date";
import { sumEntries } from "../lib/totals";
import { round1 } from "../lib/format";
import type { Meal, FoodEntry, NewFoodEntry } from "../types/macros";
import type { Profile } from "../types/profile";
import { IconChevronLeft, IconChevronRight } from "../components/icons";
import { AddFlow } from "../components/AddFlow";
import { DayDetail } from "./DayDetail";

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

function dayLabel(iso: string): string {
  if (isToday(iso)) return "Today";
  const t = new Date(`${todayISO()}T00:00:00`).getTime();
  const d = new Date(`${iso}T00:00:00`).getTime();
  const diff = Math.round((d - t) / 86_400_000);
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: "long" });
}
function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function Diary({ profile, addSignal }: { profile: Profile; addSignal: number }) {
  const [date, setDate] = useState(todayISO());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<Meal | null>(null);
  const [detail, setDetail] = useState(false);

  useEffect(() => {
    mealsApi.getMeals().then(setMeals).catch((e) => setError(errMsg(e)));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const d = await macrosApi.getDay(date);
        if (!cancelled) setEntries(d);
      } catch (e) {
        if (!cancelled) setError(errMsg(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const ordered = useMemo(() => [...meals].sort((a, b) => a.position - b.position), [meals]);

  // FAB on the tab bar bumps addSignal -> open add for the first meal.
  // Intentional external-signal response.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (addSignal > 0 && ordered.length) setAdding(ordered[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addSignal]);

  const addEntry = async (e: NewFoodEntry) => {
    const created = await macrosApi.createFoodEntry({ ...e, date });
    setEntries((prev) => [...prev, created]);
  };

  const del = async (id: number) => {
    try {
      await macrosApi.deleteFoodEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const dayTotals = sumEntries(entries);

  if (detail) {
    return <DayDetail label={dayLabel(date)} entries={entries} profile={profile} onBack={() => setDetail(false)} />;
  }

  return (
    <>
      <div className="appbar">
        <div>
          <p className="hi">Nutrition</p>
          <p className="who">Diary</p>
        </div>
      </div>

      <div className="daynav">
        <button onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
          <IconChevronLeft />
        </button>
        <div className="dd">
          <b>{dayLabel(date)}</b>
          <small>{shortDate(date)}</small>
        </div>
        <button onClick={() => setDate(addDays(date, 1))} aria-label="Next day">
          <IconChevronRight />
        </button>
      </div>

      {error && (
        <div className="banner">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <button
        className="row tap"
        onClick={() => setDetail(true)}
        style={{ background: "var(--wcard)", color: "var(--wcard-fg)", border: "none" }}
      >
        <div className="t">
          <b>{isToday(date) ? "Total today" : "Total"}</b>
          <small style={{ opacity: 0.7 }}>Tap for full breakdown ›</small>
        </div>
        <span className="kc" style={{ fontSize: 16 }}>
          {Math.round(dayTotals.calories).toLocaleString()}
          <small style={{ color: "inherit", opacity: 0.7 }}>kcal</small>
        </span>
      </button>

      {loading ? (
        <div className="loading">Loading your day…</div>
      ) : (
        ordered.map((meal) => {
          const items = entries.filter((e) => e.meal_id === meal.id);
          const t = sumEntries(items);
          return (
            <div className="mealgroup" key={meal.id}>
              <div className="gh">
                <div className="gl">
                  <b>{meal.name}</b>
                  <small>{Math.round(t.calories).toLocaleString()} kcal</small>
                </div>
                <div className="gm">
                  P {round1(t.protein)} · C {round1(t.carbs)} · F {round1(t.fat)}
                </div>
              </div>
              <div className="mitems">
                {items.map((e) => (
                  <div className="mfrow" key={e.id}>
                    <div className="mt">
                      <b>{e.food_name}</b>
                      <small>
                        P {round1(e.protein ?? 0)} · C {round1(e.carbs ?? 0)} · F {round1(e.fat ?? 0)}
                      </small>
                    </div>
                    <span className="mk">{Math.round(e.calories ?? 0)}</span>
                    <button className="mdel" onClick={() => del(e.id)} aria-label="Delete">
                      ✕
                    </button>
                  </div>
                ))}
                <button className="addlink" onClick={() => setAdding(meal)}>
                  ＋ Add food
                </button>
              </div>
            </div>
          );
        })
      )}

      {!loading && ordered.length === 0 && (
        <div className="emptystate">No meals set up yet.</div>
      )}

      {adding && (
        <AddFlow meals={ordered} initialMealId={adding.id} onAdd={addEntry} onClose={() => setAdding(null)} />
      )}
    </>
  );
}
