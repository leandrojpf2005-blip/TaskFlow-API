import type { MacroTargets } from "../types/macros";
import type { Totals } from "../lib/totals";
import { MacroRing } from "./MacroRing";

interface DailySummaryProps {
  consumed: Totals;
  targets: MacroTargets;
}

interface BarProps {
  label: string;
  value: number;
  target: number;
  variant: "protein" | "carbs" | "fat";
}

function MacroBar({ label, value, target, variant }: BarProps) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div className="macrobar">
      <div className="macrobar-head">
        <span className="macrobar-label">{label}</span>
        <span className="macrobar-value">
          {value}
          <span className="macrobar-target"> / {target}g</span>
        </span>
      </div>
      <div className="macrobar-track">
        <div
          className={`macrobar-fill macrobar-fill--${variant}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function DailySummary({ consumed, targets }: DailySummaryProps) {
  return (
    <section className="summary card">
      <div className="summary-ring">
        <MacroRing consumed={consumed.calories} target={targets.calories} />
      </div>

      <div className="summary-bars">
        <MacroBar label="Protein" value={consumed.protein} target={targets.protein} variant="protein" />
        <MacroBar label="Carbs" value={consumed.carbs} target={targets.carbs} variant="carbs" />
        <MacroBar label="Fat" value={consumed.fat} target={targets.fat} variant="fat" />
      </div>
    </section>
  );
}
