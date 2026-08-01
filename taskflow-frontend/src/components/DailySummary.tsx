import type { MacroTargets } from "../types/macros";
import type { Totals } from "../lib/totals";
import { round1 } from "../lib/format";
import { MacroRing } from "./MacroRing";

interface DailySummaryProps {
  consumed: Totals;
  targets: MacroTargets;
}

interface MacroStatProps {
  label: string;
  value: number;
  target: number;
  color: string;
}

function MacroStat({ label, value, target, color }: MacroStatProps) {
  const remaining = Math.max(target - value, 0);
  return (
    <div className="macrostat">
      <MacroRing
        value={value}
        target={target}
        size={72}
        stroke={7}
        color={color}
        center={<span className="macrostat-pct">{Math.round((value / target) * 100) || 0}%</span>}
      />
      <div className="macrostat-meta">
        <span className="macrostat-label" style={{ color }}>
          {label}
        </span>
        <span className="macrostat-value">
          {round1(value)}
          <span className="macrostat-target"> / {round1(target)}g</span>
        </span>
        <span className="macrostat-left">{round1(remaining)}g left</span>
      </div>
    </div>
  );
}

export function DailySummary({ consumed, targets }: DailySummaryProps) {
  const remaining = Math.max(targets.calories - consumed.calories, 0);
  const over = consumed.calories > targets.calories;

  return (
    <section className="hero">
      <div className="hero-glow" aria-hidden />

      <div className="hero-cal">
        <MacroRing
          value={consumed.calories}
          target={targets.calories}
          size={188}
          stroke={14}
          color="var(--primary)"
          center={
            <div className="hero-cal-center">
              <span className="hero-cal-num">{over ? consumed.calories : remaining}</span>
              <span className="hero-cal-label">{over ? "kcal over" : "kcal left"}</span>
            </div>
          }
        />
        <div className="hero-cal-foot">
          <strong>{consumed.calories}</strong>
          <span> / {targets.calories} kcal eaten</span>
        </div>
      </div>

      <div className="hero-macros">
        <MacroStat label="Protein" value={consumed.protein} target={targets.protein} color="var(--protein)" />
        <MacroStat label="Carbs" value={consumed.carbs} target={targets.carbs} color="var(--carbs)" />
        <MacroStat label="Fat" value={consumed.fat} target={targets.fat} color="var(--fat)" />
      </div>
    </section>
  );
}
