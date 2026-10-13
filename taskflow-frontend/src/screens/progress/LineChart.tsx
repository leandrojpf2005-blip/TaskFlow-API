// Smoothed single-series area chart (the weight / measurement / lift trends).
// One hue, so no categorical palette; the list under each chart is the
// accessible table view of the same numbers.

export interface Pt {
  t: number; // epoch ms
  v: number;
}

const W = 300;
const H = 130;
const PAD = { l: 8, r: 8, t: 10, b: 8 };

function smoothPath(xy: [number, number][]): string {
  if (xy.length === 1) return `M${xy[0][0]},${xy[0][1]}`;
  let d = `M${xy[0][0]},${xy[0][1]}`;
  for (let i = 0; i < xy.length - 1; i++) {
    const [x0, y0] = xy[i - 1] ?? xy[i];
    const [x1, y1] = xy[i];
    const [x2, y2] = xy[i + 1];
    const [x3, y3] = xy[i + 2] ?? xy[i + 1];
    // Catmull-Rom → cubic Bézier, tension 1/6.
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  return d;
}

export function LineChart({ points, from, to, label }: { points: Pt[]; from: number; to: number; label: string }) {
  if (points.length === 0) return null;
  const vs = points.map((p) => p.v);
  let lo = Math.min(...vs);
  let hi = Math.max(...vs);
  if (hi - lo < 1e-6) {
    lo -= 1;
    hi += 1;
  }
  const span = hi - lo;
  lo -= span * 0.12;
  hi += span * 0.08;
  const t0 = Math.min(from, points[0].t);
  const t1 = Math.max(to, points[points.length - 1].t);
  const x = (t: number) => PAD.l + ((t - t0) / Math.max(1, t1 - t0)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  const xy = points.map((p) => [x(p.t), y(p.v)] as [number, number]);
  const line = smoothPath(xy);
  const area = `${line} L${xy[xy.length - 1][0].toFixed(1)},${H} L${xy[0][0].toFixed(1)},${H} Z`;
  const showAll = xy.length <= 8;
  const grid = [0.25, 0.5, 0.75].map((g) => PAD.t + g * (H - PAD.t - PAD.b));

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {grid.map((gy) => (
        <line key={gy} x1={0} x2={W} y1={gy} y2={gy} stroke="var(--line)" strokeDasharray="4 5" strokeWidth={1} />
      ))}
      <path d={area} fill="var(--accent-soft)" />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      {xy.map(([px, py], i) => {
        const lastPt = i === xy.length - 1;
        if (!showAll && i !== 0 && !lastPt) return null;
        return (
          <circle
            key={i}
            cx={px}
            cy={py}
            r={lastPt ? 4.5 : 4}
            fill={lastPt ? "var(--accent)" : "var(--card)"}
            stroke={lastPt ? "var(--card)" : "var(--accent)"}
            strokeWidth={lastPt ? 2 : 2.2}
          />
        );
      })}
    </svg>
  );
}
