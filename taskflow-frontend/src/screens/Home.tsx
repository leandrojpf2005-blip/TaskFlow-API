import { useEffect, useState } from "react";
import { getDay } from "../api/macros";
import { todayISO } from "../lib/date";
import { sumEntries, EMPTY_TOTALS, type Totals } from "../lib/totals";
import { round1 } from "../lib/format";
import { MacroRing } from "../components/MacroRing";
import type { Profile } from "../types/profile";
import type { User } from "../api/auth";

export function Home({ user, profile }: { user: User; profile: Profile }) {
  const [totals, setTotals] = useState<Totals>(EMPTY_TOTALS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getDay(todayISO())
      .then((day) => {
        if (!cancelled) setTotals(sumEntries(day));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const goal = profile.target_calories ?? 0;
  const left = Math.max(goal - Math.round(totals.calories), 0);
  const pG = profile.target_protein_g ?? 0;
  const cG = profile.target_carbs_g ?? 0;
  const fG = profile.target_fat_g ?? 0;
  const pct = (v: number, g: number) => (g > 0 ? Math.round((v / g) * 100) : 0);

  // Weekly chart: today's real value + sample history (wired fully in a later stage).
  const week = [2410, 2680, 2180, 2590, 2750, 2300, Math.round(totals.calories)];
  const max = Math.max(...week, goal || 1);
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const avg = Math.round(week.reduce((a, b) => a + b, 0) / week.length);

  return (
    <>
      <div className="appbar">
        <div>
          <p className="hi">Good to see you</p>
          <p className="who">{user.username} 👋</p>
        </div>
        <div className="avatar">{user.username.charAt(0).toUpperCase()}</div>
      </div>

      <div className="hero">
        <MacroRing
          value={totals.calories}
          target={goal || 1}
          size={158}
          stroke={13}
          color="#fff"
          center={
            <>
              <b>{loading ? "…" : left.toLocaleString()}</b>
              <small>kcal left</small>
            </>
          }
        />
        <div className="herofoot">
          <div className="hp">
            <div className="l">Goal</div>
            <div className="v">{goal.toLocaleString()}</div>
          </div>
          <div className="hp">
            <div className="l">Food</div>
            <div className="v">{Math.round(totals.calories).toLocaleString()}</div>
          </div>
          <div className="hp">
            <div className="l">Left</div>
            <div className="v">{left.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="macro3">
        <MacroCard lab="Protein" v={totals.protein} g={pG} color="var(--p-color)" pct={pct(totals.protein, pG)} />
        <MacroCard lab="Carbs" v={totals.carbs} g={cG} color="var(--c-color)" pct={pct(totals.carbs, cG)} />
        <MacroCard lab="Fat" v={totals.fat} g={fG} color="var(--f-color)" pct={pct(totals.fat, fG)} />
      </div>

      <div className="gcard">
        <div className="gh">
          <b>Calories · this week</b>
          <span>avg {avg.toLocaleString()}</span>
        </div>
        <div className="chart">
          {week.map((v, i) => (
            <div key={i} className={"col" + (i === 6 ? " today" : "")}>
              <i style={{ height: `${Math.round((v / max) * 100)}%` }} />
              <small>{days[i]}</small>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function MacroCard({
  lab,
  v,
  g,
  color,
  pct,
}: {
  lab: string;
  v: number;
  g: number;
  color: string;
  pct: number;
}) {
  return (
    <div className="m">
      <div className="lab">{lab}</div>
      <div className="val">
        {round1(v)}
        <span>/{g}g</span>
      </div>
      <div className="bar">
        <i style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
      <div className="pct">{pct}% of goal</div>
    </div>
  );
}
