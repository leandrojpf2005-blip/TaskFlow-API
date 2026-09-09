import type { FoodEntry } from "../types/macros";
import type { Profile } from "../types/profile";
import { sumEntries } from "../lib/totals";
import { round1 } from "../lib/format";
import { MacroRing } from "../components/MacroRing";
import { IconChevronLeft } from "../components/icons";

type MacroKey = "protein" | "carbs" | "fat";

export function DayDetail({
  label,
  entries,
  profile,
  onBack,
}: {
  label: string;
  entries: FoodEntry[];
  profile: Profile;
  onBack: () => void;
}) {
  const t = sumEntries(entries);
  const pc = t.protein * 4;
  const cc = t.carbs * 4;
  const fc = t.fat * 9;
  const tot = pc + cc + fc || 1;

  const topBy = (key: MacroKey) =>
    [...entries]
      .filter((e) => (e[key] ?? 0) > 0)
      .sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0))
      .slice(0, 4);

  const micros: [string, string][] = [
    ["Fiber", `${Math.round(t.carbs * 0.12)} g`],
    ["Sugar", `${Math.round(t.carbs * 0.34)} g`],
    ["Saturated fat", `${Math.round(t.fat * 0.32)} g`],
    ["Sodium", `${(entries.length * 190).toLocaleString()} mg`],
    ["Cholesterol", `${Math.round(t.fat * 4)} mg`],
  ];

  const macroRow = (labText: string, v: number, goal: number, cals: number, color: string) => (
    <div className="drow" key={labText}>
      <div className="dl">
        <span className="dot" style={{ background: color }} />
        {labText}
      </div>
      <div className="dv">
        {round1(v)} g
        <small>
          {goal > 0 ? Math.round((v / goal) * 100) : 0}% goal · {Math.round((cals / tot) * 100)}% cals
        </small>
      </div>
    </div>
  );

  const macroLabels: Record<MacroKey, string> = { protein: "protein", carbs: "carb", fat: "fat" };

  return (
    <>
      <div className="appbar">
        <button className="backbtn" onClick={onBack}>
          <IconChevronLeft /> {label} · summary
        </button>
      </div>

      <div className="hero">
        <MacroRing
          value={t.calories}
          target={profile.target_calories || 1}
          size={150}
          stroke={13}
          color="#fff"
          center={
            <>
              <b>{Math.round(t.calories).toLocaleString()}</b>
              <small>kcal total</small>
            </>
          }
        />
      </div>

      <div className="sechead">
        <b>Macros</b>
      </div>
      <div className="dcard">
        {macroRow("Protein", t.protein, profile.target_protein_g ?? 0, pc, "var(--p-color)")}
        {macroRow("Carbs", t.carbs, profile.target_carbs_g ?? 0, cc, "var(--c-color)")}
        {macroRow("Fat", t.fat, profile.target_fat_g ?? 0, fc, "var(--f-color)")}
      </div>

      <div className="sechead">
        <b>Micronutrients</b>
        <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>estimated</span>
      </div>
      <div className="dcard">
        {micros.map(([l, v]) => (
          <div className="drow" key={l}>
            <div className="dl">{l}</div>
            <div className="dv">{v}</div>
          </div>
        ))}
      </div>

      {(["protein", "carbs", "fat"] as MacroKey[]).map((key) => {
        const top = topBy(key);
        return (
          <div key={key} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="sechead">
              <b>Top {macroLabels[key]} sources</b>
            </div>
            {top.length ? (
              top.map((e) => (
                <div className="row" key={e.id}>
                  <div className="t">
                    <b>{e.food_name}</b>
                  </div>
                  <span className="kc">
                    {round1(e[key] ?? 0)}
                    <small>g</small>
                  </span>
                </div>
              ))
            ) : (
              <div className="emptystate">Nothing logged</div>
            )}
          </div>
        );
      })}
    </>
  );
}
