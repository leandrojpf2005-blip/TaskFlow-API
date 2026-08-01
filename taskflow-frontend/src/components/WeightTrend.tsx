import { useState } from "react";
import type { Measurement } from "../types/measurements";
import { round1 } from "../lib/format";

// Single-series weight-over-time line chart. Uses the app's --primary accent
// (one hue, so no categorical palette to reason about). The history list below
// doubles as the accessible table view.

interface WeightTrendProps {
  measurements: Measurement[];
}

const VB_W = 640;
const VB_H = 240;
const PAD = { l: 46, r: 18, t: 18, b: 30 };
const PLOT_W = VB_W - PAD.l - PAD.r;
const PLOT_H = VB_H - PAD.t - PAD.b;
const BASELINE = PAD.t + PLOT_H;

function shortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function WeightTrend({ measurements }: WeightTrendProps) {
  const [hover, setHover] = useState<number | null>(null);

  // Only weigh-ins, oldest → newest (date, then id as tiebreak for same-day logs).
  const points = measurements
    .filter((m) => m.weight_kg != null)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id))
    .map((m) => ({ date: m.date, weight: m.weight_kg as number }));

  if (points.length < 2) {
    return (
      <div className="trend-empty">
        Log at least two weigh-ins to see your trend.
      </div>
    );
  }

  const n = points.length;
  const weights = points.map((p) => p.weight);
  const lo = Math.min(...weights);
  const hi = Math.max(...weights);
  const pad = hi === lo ? 1 : (hi - lo) * 0.18;
  const yMin = lo - pad;
  const yMax = hi + pad;

  const x = (i: number) => PAD.l + (i / (n - 1)) * PLOT_W;
  const y = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * PLOT_H;

  const coords = points.map((p, i) => ({ ...p, cx: x(i), cy: y(p.weight) }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.cx} ${c.cy}`).join(" ");
  const area = `M ${coords[0].cx} ${BASELINE} L ${coords
    .map((c) => `${c.cx} ${c.cy}`)
    .join(" L ")} L ${coords[n - 1].cx} ${BASELINE} Z`;

  // Four horizontal gridlines across the padded range.
  const ticks = [0, 1, 2, 3].map((k) => {
    const v = yMax - (k / 3) * (yMax - yMin);
    return { v, gy: y(v) };
  });

  // X labels: first, last, and middle if there's room.
  const labelIdx = n >= 3 ? [0, Math.floor((n - 1) / 2), n - 1] : [0, n - 1];

  const last = coords[n - 1];
  const delta = round1(last.weight - coords[0].weight);

  return (
    <div className="trend">
      <div className="trend-head">
        <div>
          <span className="trend-now">{round1(last.weight)}</span>
          <span className="trend-unit">kg</span>
        </div>
        <span className={`trend-delta ${delta > 0 ? "up" : delta < 0 ? "down" : ""}`}>
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "±"} {round1(Math.abs(delta))} kg since start
        </span>
      </div>

      <div className="trend-plot">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          width="100%"
          role="img"
          aria-label={`Weight trend, ${round1(coords[0].weight)} kg to ${round1(last.weight)} kg over ${n} weigh-ins`}
        >
          {/* gridlines + y labels */}
          {ticks.map((t, i) => (
            <g key={i}>
              <line
                x1={PAD.l}
                x2={VB_W - PAD.r}
                y1={t.gy}
                y2={t.gy}
                className="trend-grid"
              />
              <text x={PAD.l - 8} y={t.gy + 3} textAnchor="end" className="trend-ylabel">
                {round1(t.v)}
              </text>
            </g>
          ))}

          {/* x labels */}
          {labelIdx.map((i) => (
            <text
              key={i}
              x={coords[i].cx}
              y={BASELINE + 20}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              className="trend-xlabel"
            >
              {shortDate(coords[i].date)}
            </text>
          ))}

          <path d={area} className="trend-area" />
          <path d={line} className="trend-line" />

          {/* points */}
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.cx}
              cy={c.cy}
              r={i === n - 1 ? 4.5 : 3}
              className={`trend-dot ${i === n - 1 ? "trend-dot--end" : ""} ${hover === i ? "trend-dot--hover" : ""}`}
            />
          ))}

          {/* invisible hit targets */}
          {coords.map((c, i) => (
            <circle
              key={`h${i}`}
              cx={c.cx}
              cy={c.cy}
              r={16}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>

        {hover != null && (
          <div
            className="trend-tip"
            style={{
              left: `${(coords[hover].cx / VB_W) * 100}%`,
              top: `${(coords[hover].cy / VB_H) * 100}%`,
            }}
          >
            <strong>{round1(coords[hover].weight)} kg</strong>
            <span>{shortDate(coords[hover].date)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
