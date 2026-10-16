// Line-art pictograms for the exercise library, drawn in code: a stick figure
// posed per movement (joint angles, or a hand/foot target solved with two-bone
// IK) plus the variant's equipment — a barbell, dumbbells, a cable… — so the
// same movement reads differently per variant. 48×48 grid, figure faces right.

export type P = [number, number];
// halo: a band in the tile colour drawn under a near limb, so an arm crossing
// the body stays readable.
export type Layer = "env" | "far" | "fargear" | "halo" | "gear" | "fig";
export type Shape =
  | { k: "path"; d: string; layer: Layer; w?: number }
  | { k: "dot"; c: P; r: number; layer: Layer; fill?: boolean; w?: number };

type Kit =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "smith_machine"
  | "ez_bar"
  | "kettlebell"
  | "trap_bar"
  | "plate"
  | "bodyweight"
  | "assisted"
  | "weighted"
  | "cardio";

interface Rig {
  hip: P;
  dir: P; // unit vector hip → neck
  shoulder: P;
  neck: P;
  head: P;
  knees: P[];
  feet: P[];
  load: P | null;
  elbows: P[];
  hands: P[];
}

type Target = P | ((r: Rig) => P);
// [upper angle, lower angle] in degrees (0 = right, 90 = down), or a target the
// hand/foot reaches for; bend picks which side the elbow/knee goes.
type Limb = [number, number] | { to: Target; bend?: number };

interface Pose {
  hip: P;
  torso?: number;
  head?: number;
  arms?: Limb[];
  legs?: Limb[];
  front?: boolean; // front view: every limb full strength, one limb is mirrored
  scale?: number;
  env?: (r: Rig) => string; // bench, floor, bars… drawn light, always
  prop?: (r: Rig) => string; // kit drawn like equipment, always (ab wheel, rope)
  load?: (r: Rig) => P; // where a barbell sits (default: the near hand)
  pulley?: P | P[];
  machine?: (r: Rig) => string;
  toes?: number; // draw feet pointing this way (calf raises)
  by?: Partial<Record<Kit, Partial<Pose>>>;
}

const LEN = { torso: 13, shoulder: 11.5, neck: 5.2, head: 3.6, ua: 7.5, fa: 7, th: 10, sh: 10 };

const rad = (d: number) => (d * Math.PI) / 180;
const at = (p: P, deg: number, len: number): P => [p[0] + len * Math.cos(rad(deg)), p[1] + len * Math.sin(rad(deg))];
const add = (p: P, x: number, y: number): P => [p[0] + x, p[1] + y];
const angle = (a: P, b: P) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
const n1 = (v: number) => Math.round(v * 10) / 10;
const L = (...pts: P[]) => pts.map((p, i) => `${i ? "L" : "M"}${n1(p[0])} ${n1(p[1])}`).join("");

function ik(a: P, l1: number, l2: number, t: P, bend: number): [P, P] {
  const dist = Math.hypot(t[0] - a[0], t[1] - a[1]);
  const d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(dist, l1 + l2 - 0.01));
  const c = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const base = Math.atan2(t[1] - a[1], t[0] - a[0]);
  const ang = base + bend * Math.acos(Math.max(-1, Math.min(1, c)));
  const j: P = [a[0] + l1 * Math.cos(ang), a[1] + l1 * Math.sin(ang)];
  return [j, at(j, angle(j, t), l2)];
}

function solve(root: P, l1: number, l2: number, spec: Limb, bend: number, r: Rig): [P, P] {
  if (Array.isArray(spec)) {
    const j = at(root, spec[0], l1);
    return [j, at(j, spec[1], l2)];
  }
  const t = typeof spec.to === "function" ? spec.to(r) : spec.to;
  return ik(root, l1, l2, t, spec.bend ?? bend);
}

function mirror(spec: Limb, cx: number): Limb {
  if (Array.isArray(spec)) return [180 - spec[0], 180 - spec[1]];
  const to = spec.to;
  return {
    to: typeof to === "function" ? (r: Rig) => { const p = to(r); return [2 * cx - p[0], p[1]]; } : [2 * cx - to[0], to[1]],
    bend: -(spec.bend ?? 1),
  };
}

function rig(p: Pose): Rig {
  const s = p.scale ?? 1;
  const tdeg = p.torso ?? -90;
  const dir = at([0, 0], tdeg, 1);
  const shoulder = at(p.hip, tdeg, LEN.shoulder * s);
  const neck = at(p.hip, tdeg, LEN.torso * s);
  const head = at(neck, p.head ?? tdeg, LEN.neck * s);
  const r: Rig = { hip: p.hip, dir, shoulder, neck, head, knees: [], feet: [], load: null, elbows: [], hands: [] };
  const legs = p.front && p.legs?.length === 1 ? [p.legs[0], mirror(p.legs[0], p.hip[0])] : p.legs ?? [];
  for (const l of legs) {
    const [k, f] = solve(p.hip, LEN.th * s, LEN.sh * s, l, -1, r);
    r.knees.push(k);
    r.feet.push(f);
  }
  r.load = p.load ? p.load(r) : null;
  const arms = p.front && p.arms?.length === 1 ? [p.arms[0], mirror(p.arms[0], p.hip[0])] : p.arms ?? [];
  for (const a of arms) {
    const [e, h] = solve(shoulder, LEN.ua * s, LEN.fa * s, a, 1, r);
    r.elbows.push(e);
    r.hands.push(h);
  }
  return r;
}

// ---------------------------------------------------------------- helpers
const back = (r: Rig, d: number): P => [r.shoulder[0] + r.dir[1] * d, r.shoulder[1] - r.dir[0] * d];
const front = (r: Rig, d: number): P => [r.shoulder[0] - r.dir[1] * d, r.shoulder[1] + r.dir[0] * d];
const toLoad = (bend = 1): Limb => ({ to: (r) => r.load ?? r.shoulder, bend });
const bench = (x1: number, x2: number, y: number) => `M${x1} ${y}H${x2}M${x1 + 3} ${y}V45.5M${x2 - 3} ${y}V45.5`;
const floor = (y = 46.5) => `M2 ${y}H46`;
/** A line parallel to a→b, `off` to its right (screen coords), stretched by `ext`. */
function along(a: P, b: P, off: number, ext = 0): string {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len;
  const nx = -uy * off, ny = ux * off;
  return L([a[0] + nx - ux * ext, a[1] + ny - uy * ext], [b[0] + nx + ux * ext, b[1] + ny + uy * ext]);
}
const seat = (x: number, y: number, w = 12) => `M${x - w / 2} ${y}H${x + w / 2}M${x} ${y}V45.5`;
const backrest = (x: number, y1: number, y2: number) => `M${x} ${y1}V${y2}`;
const arrowUp = (x: number, y: number) => `M${x - 2} ${y + 2}L${x} ${y}L${x + 2} ${y + 2}`;

// ---------------------------------------------------------------- poses
const STAND: P = [24, 24.5];

const lying: Pose = {
  hip: [31, 28.5],
  torso: 180,
  legs: [{ to: [39.5, 44.5] }],
  arms: [[-90, -90]],
  env: () => bench(7, 36, 32.6),
};
const incline: Pose = {
  hip: [31, 32],
  torso: -146,
  legs: [{ to: [40, 44.5] }],
  arms: [[-86, -88]],
  env: (r) => `${along(r.hip, r.neck, -3.4, 1)}M${r.hip[0] - 2} ${r.hip[1] + 3.4}H36M30 35.4V45.5`,
};
const seatedUp: Pose = {
  hip: [21, 33],
  legs: [[0, 90]],
  arms: [[-88, -92]],
  env: () => `${seat(22, 36.5, 14)}${backrest(16.6, 15, 36.5)}`,
};
const standCurl: Pose = { hip: STAND, legs: [[90, 90], [92, 90]], arms: [[102, -42], [92, -40]] };
const hinge = (torso: number, hip: P, foot: P): Pose => ({
  hip,
  torso,
  legs: [{ to: foot }, { to: add(foot, -1.5, 0) }],
  arms: [[90, 90], [92, 90]],
});
const squatBack: Pose = {
  hip: [17, 33],
  torso: -52,
  head: -30,
  legs: [{ to: [23, 44.5] }, { to: [21.5, 44.5] }],
  load: (r) => back(r, 4.6),
  arms: [toLoad(1)],
  by: {
    dumbbell: { load: undefined, arms: [[88, 90], [92, 90]] },
    bodyweight: { load: undefined, arms: [[-6, -6], [-2, -4]] },
  },
};
const lunge: Pose = {
  hip: [22, 30.5],
  legs: [{ to: [32, 44.5] }, [116, 170]],
  arms: [[90, 90], [94, 90]],
  by: {
    barbell: { load: (r) => back(r, 3.4), arms: [toLoad(1)] },
    smith_machine: { load: (r) => back(r, 3.4), arms: [toLoad(1)] },
    bodyweight: { arms: [[100, 20], [100, 20]] },
  },
};
const hangFront: Pose = {
  hip: [24, 26.5],
  front: true,
  legs: [[94, 98]],
  arms: [[204, -95]],
  env: (r) => `M5 ${n1(r.hands[0][1])}H43`,
  by: {
    assisted: { prop: (r) => `M14 ${n1(r.feet[0][1] + 2.8)}H34` },
    weighted: { load: (r) => add(r.hip, 0, 7.5) },
  },
};
const dip: Pose = {
  hip: [24, 23],
  scale: 0.92,
  front: true,
  legs: [[93, 97]],
  arms: [[118, 74]],
  env: (r) => r.hands.map((h) => { const x = h[0] < 24 ? h[0] - 4.5 : h[0] + 4.5; return `M${n1(h[0] + (h[0] < 24 ? 3 : -3))} ${n1(h[1] + 1.8)}H${n1(x)}V45.5`; }).join(""),
  by: {
    assisted: { prop: (r) => `M15 ${n1(r.feet[0][1] + 2.8)}H33` },
    weighted: { load: (r) => add(r.hip, 0, 7) },
  },
};
const plankHigh: Pose = {
  hip: [23, 33.6],
  torso: 207,
  legs: [[27, 27]],
  arms: [{ to: (r) => [r.shoulder[0] + 0.8, 42.6], bend: 1 }],
  env: () => floor(44.8),
};

const POSES: Record<string, Pose> = {
  // ------------------------------------------------------------ chest
  "bench-press": lying,
  "close-grip-bench-press": lying,
  "incline-bench-press": incline,
  "decline-bench-press": {
    hip: [31, 25],
    torso: 163,
    legs: [[2, 72]],
    arms: [[-90, -90]],
    env: (r) => `${along(r.hip, r.neck, -3.4, 1)}M${n1(r.feet[0][0] + 2)} ${n1(r.feet[0][1] + 1)}V45.5M18 31V45.5`,
  },
  "chest-press": {
    hip: [19, 33],
    legs: [[0, 90]],
    arms: [[12, -4]],
    env: () => `${seat(20, 36.5, 13)}${backrest(14.8, 15, 36.5)}`,
    machine: (r) => { const h = r.hands[0]; return `M${n1(h[0])} ${n1(h[1] - 4)}V${n1(h[1] + 4)}M${n1(h[0])} ${n1(h[1] - 4)}L42 8V45.5`; },
  },
  "chest-fly": {
    hip: [24, 27],
    front: true,
    legs: [[96, 90]],
    arms: [[186, 208]],
    env: () => "M20.5 10.5H27.5V30H20.5Z",
    pulley: [[3, 12], [45, 12]],
    machine: (r) => r.hands.map((h) => `M${n1(h[0])} ${n1(h[1] - 4)}V${n1(h[1] + 5)}`).join(""),
  },
  "incline-chest-fly": {
    hip: [24, 27],
    front: true,
    legs: [[96, 90]],
    arms: [[200, 220]],
    env: () => "M20.5 10.5H27.5V30H20.5Z",
    pulley: [[3, 30], [45, 30]],
  },
  "cable-crossover": {
    hip: STAND,
    front: true,
    legs: [[96, 90]],
    arms: [[150, 66]],
    pulley: [[3, 4], [45, 4]],
  },
  "push-up": plankHigh,
  "incline-push-up": {
    hip: [26, 30],
    torso: 214,
    legs: [[34, 34]],
    arms: [{ to: (r) => [r.shoulder[0] + 1, 35], bend: 1 }],
    env: (r) => `M${n1(r.hands[0][0] - 6)} 36.8H${n1(r.hands[0][0] + 6)}V45.5M${n1(r.hands[0][0] - 6)} 36.8V45.5${floor()}`,
  },
  "chest-dip": dip,
  "triceps-dip": { ...dip, arms: [[112, 80]] },
  "bench-dip": {
    hip: [20, 34],
    torso: -84,
    legs: [[6, 10]],
    arms: [{ to: [13, 31.5], bend: 1 }],
    env: () => `M3 33.3H15M6 33.3V45.5M12 33.3V45.5${floor()}`,
  },
  pullover: { ...lying, arms: [[198, 200]] },
  "floor-press": {
    hip: [31, 37],
    torso: 180,
    legs: [{ to: [40, 44] }],
    arms: [[-92, -88]],
    env: () => floor(41),
  },

  // ------------------------------------------------------------ back
  deadlift: hinge(-38, [16, 27], [22, 44.5]),
  "sumo-deadlift": hinge(-52, [17, 29], [22, 44.5]),
  "rack-pull": { ...hinge(-60, [18, 24.5], [21, 44.5]), env: (r) => `M${n1(r.hands[0][0] + 6.5)} 14V45.5M${n1(r.hands[0][0] + 6.5)} ${n1(r.hands[0][1] + 5)}h-4` },
  "romanian-deadlift": { ...hinge(-18, [14, 27], [21, 44.5]), legs: [{ to: [21, 44.5], bend: -0.4 }, { to: [19.5, 44.5], bend: -0.4 }] },
  "stiff-leg-deadlift": { ...hinge(-8, [13, 27], [20, 44.5]), legs: [{ to: [20, 44.5], bend: -0.25 }, { to: [18.5, 44.5], bend: -0.25 }] },
  "good-morning": {
    hip: [15, 25],
    torso: -12,
    head: 10,
    legs: [{ to: [19, 44.5], bend: -0.4 }, { to: [17.5, 44.5], bend: -0.4 }],
    load: (r) => back(r, 4.6),
    arms: [toLoad(1)],
  },
  "bent-over-row": {
    hip: [16, 27],
    torso: -26,
    legs: [{ to: [22, 44.5] }, { to: [20.5, 44.5] }],
    arms: [{ to: (r) => add(r.hip, 8.5, 2.5), bend: 1 }],
  },
  "pendlay-row": {
    hip: [14, 28],
    torso: -6,
    legs: [{ to: [21, 44.5] }, { to: [19.5, 44.5] }],
    arms: [[90, 90]],
  },
  "one-arm-row": {
    hip: [15, 27],
    torso: -22,
    legs: [{ to: [25, 44.5] }, { to: [9, 44.5], bend: -0.3 }],
    arms: [{ to: (r) => add(r.hip, 8.5, 1.5), bend: 1 }, { to: (r) => add(r.knees[0], 0, -2.2) }],
    pulley: [44, 40],
  },
  "t-bar-row": {
    hip: [16, 27],
    torso: -34,
    legs: [{ to: [22, 44.5] }, { to: [20.5, 44.5] }],
    arms: [{ to: (r) => add(r.hip, 9.5, 4), bend: 1 }],
    env: (r) => L(r.hands[0], [44, 45]),
    machine: (r) => along(r.hip, r.neck, 3.6, 1),
  },
  "seated-row": {
    hip: [13, 35],
    torso: -96,
    legs: [{ to: [32, 39], bend: -1 }],
    arms: [{ to: (r) => add(r.hip, 8, -5), bend: 1 }],
    env: () => `${seat(12, 38.5, 12)}M34 33V45.5`,
    pulley: [45, 38],
    machine: (r) => { const h = r.hands[0]; return `M${n1(h[0])} ${n1(h[1] - 3.5)}V${n1(h[1] + 3.5)}M${n1(h[0])} ${n1(h[1])}H40M40 8V45.5`; },
  },
  "chest-supported-row": {
    hip: [15, 28.5],
    torso: -40,
    head: -20,
    legs: [{ to: [12, 44.5] }],
    arms: [[82, 96]],
    env: (r) => `${along(r.hip, r.neck, 3.6, 1)}M${n1(r.hip[0] + 7)} ${n1(r.hip[1] - 0.5)}V45.5`,
  },
  "inverted-row": {
    hip: [24, 33],
    torso: 200,
    legs: [[20, 20]],
    arms: [{ to: (r) => [r.shoulder[0] + 1, 19], bend: 1 }],
    env: () => `M7 19H22M9 19V45.5${floor(42.5)}`,
  },
  "lat-pulldown": {
    hip: [20, 34],
    torso: -97,
    legs: [[0, 92]],
    arms: [{ to: (r) => add(r.shoulder, 3, -11), bend: -1 }],
    env: () => `${seat(20, 37.6, 12)}M30 30.5h-5`,
    pulley: [32, 2.5],
    machine: (r) => `M${n1(r.hands[0][0] - 6)} ${n1(r.hands[0][1])}H${n1(r.hands[0][0] + 6)}L40 4V45.5`,
  },
  "pull-up": hangFront,
  "chin-up": {
    hip: [21, 31],
    torso: -94,
    legs: [[102, 140], [98, 132]],
    arms: [{ to: [24, 5], bend: -1 }],
    env: () => "M12 5H38",
    by: {
      assisted: { prop: (r) => `M${n1(r.knees[0][0] - 5)} ${n1(r.knees[0][1] + 3)}H${n1(r.knees[0][0] + 4)}` },
      weighted: { load: (r) => add(r.hip, 0, 7.5) },
    },
  },
  "straight-arm-pulldown": {
    hip: [19, 24.5],
    torso: -72,
    legs: [{ to: [22, 44.5], bend: -0.3 }, { to: [20.5, 44.5], bend: -0.3 }],
    arms: [[38, 44]],
    pulley: [44, 4],
  },
  "back-extension": {
    hip: [22, 25],
    torso: -12,
    legs: [[142, 142]],
    arms: [[95, -40]],
    env: (r) => `M17 29.5H26M21 29.5L17 45.5M${n1(r.feet[0][0] - 1)} ${n1(r.feet[0][1] + 2.6)}L11 45.5`,
    by: { weighted: { load: (r) => front(r, 4) } },
    machine: (r) => `M${n1(r.shoulder[0] - 2)} ${n1(r.shoulder[1] - 4)}V${n1(r.shoulder[1] + 5)}`,
  },
  shrug: {
    hip: STAND,
    front: true,
    legs: [[95, 90]],
    arms: [[100, 92]],
    env: (r) => `${arrowUp(r.shoulder[0] - 6, r.shoulder[1] - 4)}${arrowUp(r.shoulder[0] + 6, r.shoulder[1] - 4)}`,
    pulley: [[3, 44], [45, 44]],
  },

  // ------------------------------------------------------------ shoulders
  "overhead-press": {
    hip: [24, 27.5],
    scale: 0.9,
    front: true,
    legs: [[95, 90]],
    arms: [[-132, -100]],
    by: { machine: { hip: [21, 33], scale: 1, front: false, legs: [[0, 90]], arms: [[-80, -96]], env: () => `${seat(22, 36.5, 14)}${backrest(16.6, 15, 36.5)}` } },
    machine: (r) => `M${n1(r.hands[0][0] - 4)} ${n1(r.hands[0][1])}H${n1(r.hands[0][0] + 4)}M${n1(r.hands[0][0] + 4)} ${n1(r.hands[0][1])}L40 12V45.5`,
  },
  "seated-overhead-press": seatedUp,
  "arnold-press": { ...seatedUp, arms: [[-80, -100]] },
  "push-press": {
    hip: [24, 28.5],
    scale: 0.9,
    front: true,
    legs: [[106, 76]],
    arms: [[-132, -100]],
  },
  "lateral-raise": {
    hip: STAND,
    front: true,
    legs: [[95, 90]],
    arms: [[188, 180]],
    pulley: [[3, 44], [45, 44]],
    machine: (r) => r.elbows.map((e) => `M${n1(e[0])} ${n1(e[1] - 3.5)}V${n1(e[1] + 3.5)}`).join(""),
  },
  "front-raise": {
    hip: STAND,
    legs: [[90, 90], [92, 90]],
    arms: [[-4, -4], [80, 90]],
    pulley: [8, 45],
  },
  "reverse-fly": {
    hip: [16, 27],
    torso: -18,
    legs: [{ to: [21, 44.5] }, { to: [19.5, 44.5] }],
    arms: [[150, 160]],
    pulley: [44, 44],
    by: {
      machine: {
        hip: [19, 33],
        torso: -90,
        legs: [[0, 90]],
        arms: [[-178, -178]],
        env: () => `${seat(20, 36.5, 13)}M26 16V36.5`,
      },
    },
    machine: (r) => `M${n1(r.hands[0][0])} ${n1(r.hands[0][1] - 4)}V${n1(r.hands[0][1] + 4)}`,
  },
  "face-pull": {
    hip: STAND,
    legs: [[90, 90], [92, 90]],
    arms: [[-162, 0]],
    pulley: [45, 10],
  },
  "upright-row": {
    hip: STAND,
    legs: [[90, 90], [92, 90]],
    arms: [[-146, 52]],
    pulley: [30, 45],
  },

  // ------------------------------------------------------------ arms
  "bicep-curl": standCurl,
  "hammer-curl": standCurl,
  "reverse-curl": standCurl,
  "preacher-curl": {
    hip: [14, 32],
    torso: -78,
    legs: [[0, 90]],
    arms: [[42, -40]],
    env: (r) => `${along(r.shoulder, r.elbows[0], 3.2, 2.5)}M${n1(r.elbows[0][0] - 1)} ${n1(r.elbows[0][1] + 4)}L26 45.5${seat(14, 35.5, 10)}`,
  },
  "incline-curl": {
    hip: [27, 33],
    torso: -122,
    legs: [[8, 92]],
    arms: [[92, -42]],
    env: (r) => `${along(r.hip, r.neck, -3.4, 1)}M${n1(r.hip[0] - 3)} ${n1(r.hip[1] + 3.4)}H36M28 36.4V45.5`,
  },
  "concentration-curl": {
    hip: [14, 32],
    torso: -52,
    legs: [[0, 92], [6, 96]],
    arms: [[88, -34]],
    env: () => seat(13, 35.5, 12),
  },
  "triceps-pushdown": {
    hip: STAND,
    legs: [[90, 90], [92, 90]],
    arms: [[96, 62]],
    pulley: [31, 3],
  },
  "overhead-triceps-extension": {
    hip: [24, 26.5],
    scale: 0.9,
    legs: [[90, 90], [92, 90]],
    arms: [[-98, 140]],
    pulley: [4, 36],
  },
  skullcrusher: { ...lying, arms: [[-108, 188]] },
  "triceps-kickback": {
    hip: [16, 27],
    torso: -20,
    legs: [{ to: [22, 44.5] }, { to: [20.5, 44.5] }],
    arms: [[168, 178], [95, 90]],
    pulley: [45, 40],
  },
  "triceps-extension": {
    hip: [16, 34],
    torso: -90,
    legs: [[0, 90]],
    arms: [[30, 78]],
    env: (r) => `${seat(17, 37.5, 12)}${backrest(11.6, 17, 37.5)}${along(r.shoulder, r.elbows[0], 3.2, 2)}`,
    machine: (r) => `M${n1(r.hands[0][0] - 3)} ${n1(r.hands[0][1])}H${n1(r.hands[0][0] + 3)}`,
  },
  "wrist-curl": {
    hip: [13, 32],
    torso: -62,
    legs: [[0, 90]],
    arms: [[66, 0]],
    env: () => seat(12, 35.5, 12),
  },
  "farmers-walk": {
    hip: STAND,
    torso: -88,
    legs: [{ to: [30, 44.5] }, { to: [17, 44.5], bend: -0.4 }],
    arms: [[90, 90], [94, 90]],
  },

  // ------------------------------------------------------------ legs
  squat: squatBack,
  "front-squat": {
    hip: [17, 33],
    torso: -68,
    legs: [{ to: [23, 44.5] }, { to: [21.5, 44.5] }],
    load: (r) => front(r, 5),
    arms: [toLoad(-1)],
  },
  "goblet-squat": {
    hip: [17, 33],
    torso: -70,
    legs: [{ to: [23, 44.5] }, { to: [21.5, 44.5] }],
    arms: [{ to: (r) => add(front(r, 5.5), 0, 4), bend: -1 }],
  },
  "hack-squat": {
    hip: [17, 31],
    torso: -110,
    legs: [{ to: [29, 42.5] }],
    arms: [[96, 50]],
    env: (r) => `${along(r.hip, r.neck, -3.5, 2)}M24 45.5L36 40.5`,
  },
  "leg-press": {
    hip: [21, 37],
    torso: -152,
    legs: [{ to: [33, 24], bend: -1 }],
    arms: [[70, 10]],
    env: (r) => `${along(r.hip, r.neck, 3.5, 2)}M${n1(r.hip[0] - 1)} ${n1(r.hip[1] + 3.5)}V45.5`,
    machine: (r) => { const f = r.feet[0]; return `M${n1(f[0] - 3)} ${n1(f[1] - 4.5)}L${n1(f[0] + 4)} ${n1(f[1] + 4.5)}`; },
  },
  "calf-press": {
    hip: [21, 37],
    torso: -152,
    legs: [{ to: [36.5, 22.5], bend: -1 }],
    arms: [[70, 10]],
    toes: -60,
    env: (r) => `${along(r.hip, r.neck, 3.5, 2)}M${n1(r.hip[0] - 1)} ${n1(r.hip[1] + 3.5)}V45.5`,
    machine: (r) => { const f = r.feet[0]; return `M${n1(f[0] - 1)} ${n1(f[1] - 6.5)}L${n1(f[0] + 6)} ${n1(f[1] + 2.5)}`; },
  },
  lunge,
  "walking-lunge": lunge,
  "bulgarian-split-squat": {
    ...lunge,
    hip: [21, 31],
    legs: [{ to: [32, 44.5] }, { to: [8, 33], bend: 1 }],
    env: () => `M2 35H13M5 35V45.5M10 35V45.5`,
  },
  "step-up": {
    hip: [22, 24.5],
    legs: [{ to: [31, 36.6] }, { to: [18, 44.5], bend: -0.2 }],
    arms: [[90, 90], [94, 90]],
    env: () => "M25 38.4H43V45.5M25 38.4V45.5",
    by: lunge.by,
  },
  "leg-extension": {
    hip: [18, 32],
    torso: -94,
    legs: [[0, -6]],
    arms: [[70, 20]],
    env: () => `${seat(18, 35.5, 13)}${backrest(12.8, 15, 35.5)}`,
    machine: (r) => { const f = r.feet[0]; return `M${n1(f[0])} ${n1(f[1] + 3)}L${n1(r.knees[0][0])} ${n1(r.knees[0][1] + 3.5)}V45.5`; },
  },
  "lying-leg-curl": {
    hip: [22, 30],
    torso: -4,
    head: 10,
    legs: [[182, -72]],
    arms: [[60, 60]],
    env: () => `M7 33.5H43M10 33.5V45.5M40 33.5V45.5`,
    machine: (r) => { const f = r.feet[0]; return `M${n1(f[0] - 3.5)} ${n1(f[1])}h7`; },
  },
  "seated-leg-curl": {
    hip: [18, 32],
    torso: -94,
    legs: [[0, 118]],
    arms: [[70, 20]],
    env: () => `${seat(18, 35.5, 13)}${backrest(12.8, 15, 35.5)}`,
    machine: (r) => `M${n1(r.knees[0][0] - 4)} ${n1(r.knees[0][1] - 3.5)}h7M${n1(r.feet[0][0] - 1.5)} ${n1(r.feet[0][1] + 3)}h5`,
  },
  "nordic-curl": {
    hip: [22, 33],
    torso: -55,
    legs: [[125, 180]],
    arms: [[50, 40]],
    env: (r) => `${floor(45)}M${n1(r.feet[0][0] - 2)} ${n1(r.feet[0][1] - 3)}h5`,
  },
  "hip-thrust": {
    hip: [28, 27.5],
    torso: 196,
    head: 210,
    legs: [[4, 90]],
    load: (r) => add(r.hip, 0, -5),
    arms: [toLoad(-1)],
    env: () => `M5 29H17V45.5${floor()}`,
    by: { bodyweight: { load: undefined, arms: [[150, 185]] } },
    machine: (r) => `M${n1(r.hip[0] - 5)} ${n1(r.hip[1] - 3)}h10`,
  },
  "glute-bridge": {
    hip: [28, 33],
    torso: 163,
    legs: [{ to: [37, 41], bend: -1 }],
    load: (r) => add(r.hip, 0, -5),
    arms: [toLoad(-1)],
    env: () => floor(43.5),
    by: { bodyweight: { load: undefined, arms: [[10, 0]] } },
  },
  "glute-kickback": {
    hip: [17, 32],
    torso: -22,
    head: -10,
    legs: [[-168, -98], [90, 180]],
    arms: [{ to: (r) => [r.shoulder[0] + 1, 42.5] }],
    env: () => floor(44.5),
    pulley: [3, 44],
    machine: (r) => `M${n1(r.feet[0][0] - 3)} ${n1(r.feet[0][1] - 1)}h6`,
  },
  "hip-abduction": {
    hip: [24, 26.5],
    front: true,
    legs: [[138, 92]],
    arms: [[112, 92]],
    env: () => "M15 29.5H33",
    machine: (r) => r.knees.map((k) => `M${n1(k[0] + (k[0] < 24 ? -3.4 : 3.4))} ${n1(k[1] - 3)}v7`).join(""),
  },
  "hip-adduction": {
    hip: [24, 26.5],
    front: true,
    legs: [[142, 92]],
    arms: [[112, 92]],
    env: () => "M15 29.5H33",
    machine: (r) => r.knees.map((k) => `M${n1(k[0] + (k[0] < 24 ? 3.4 : -3.4))} ${n1(k[1] - 3)}v7`).join(""),
  },
  "standing-calf-raise": {
    hip: [24, 23],
    legs: [[90, 90], [92, 90]],
    arms: [[90, 90], [94, 90]],
    toes: 62,
    env: (r) => `M${n1(r.feet[0][0] - 1)} 46H33${arrowUp(r.feet[0][0] - 4, r.feet[0][1] - 3)}`,
    by: {
      machine: { arms: [[100, -82]] },
      smith_machine: { load: (r) => back(r, 3.4), arms: [toLoad(1)] },
      bodyweight: { arms: [[100, 20], [100, 20]] },
    },
    machine: (r) => `M${n1(r.shoulder[0] - 4)} ${n1(r.shoulder[1] - 2.6)}h8M${n1(r.shoulder[0] + 4)} ${n1(r.shoulder[1] - 2.6)}V2`,
  },
  "seated-calf-raise": {
    hip: [16, 31],
    legs: [[0, 90]],
    arms: [[70, 10]],
    toes: 62,
    env: (r) => `${seat(15, 34.5, 12)}M${n1(r.feet[0][0] - 1)} 46H36`,
    machine: (r) => `M${n1(r.knees[0][0] - 4)} ${n1(r.knees[0][1] - 3)}h8`,
  },

  // ------------------------------------------------------------ core
  plank: {
    hip: [22, 35.5],
    torso: 194,
    legs: [[14, 14]],
    arms: [[90, 0]],
    env: () => floor(45),
  },
  "side-plank": {
    hip: [22, 33],
    torso: 196,
    front: true,
    legs: [[16, 16]],
    arms: [[90, 0], [-90, -90]],
    env: () => floor(45),
  },
  crunch: {
    hip: [25, 38.5],
    torso: 204,
    head: 214,
    legs: [{ to: [36, 41], bend: -1 }],
    arms: [{ to: (r) => add(r.head, 1, -1), bend: -1 }],
    env: () => floor(43),
    by: {
      machine: {
        hip: [16, 33],
        torso: -62,
        head: -50,
        legs: [[0, 90]],
        arms: [{ to: (r) => add(r.shoulder, 2.5, -2), bend: -1 }],
        env: () => seat(16, 36.5, 12),
      },
      cable: {
        hip: [19, 32],
        torso: -22,
        head: 10,
        legs: [[90, 180]],
        arms: [{ to: (r) => add(r.head, -1, -2), bend: -1 }],
        env: () => floor(44.5),
      },
    },
    machine: (r) => `M${n1(r.shoulder[0] - 1)} ${n1(r.shoulder[1] - 3.5)}L40 8V45.5`,
    pulley: [6, 3],
  },
  "reverse-crunch": {
    hip: [27, 38],
    torso: 180,
    legs: [[-112, -8]],
    arms: [[4, 0]],
    env: () => floor(41.5),
  },
  "sit-up": {
    hip: [22, 38.5],
    torso: -128,
    legs: [{ to: [36, 41], bend: -1 }],
    arms: [[-14, -10]],
    env: () => floor(43),
  },
  "hanging-leg-raise": {
    hip: [19, 31.5],
    legs: [[2, 2], [4, 4]],
    arms: [[-90, -90]],
    env: (r) => `M10 ${n1(r.hands[0][1])}H32`,
  },
  "hanging-knee-raise": {
    hip: [19, 31.5],
    legs: [[-18, 92], [-14, 96]],
    arms: [[-90, -90]],
    env: (r) => `M10 ${n1(r.hands[0][1])}H32`,
  },
  "lying-leg-raise": {
    hip: [31, 40],
    torso: 180,
    legs: [[-76, -76]],
    arms: [[0, 0]],
    env: () => floor(43.5),
  },
  "ab-wheel": {
    hip: [17, 33],
    torso: -14,
    legs: [[118, 180]],
    arms: [{ to: [40, 40.5], bend: 1 }],
    env: () => floor(45),
    prop: (r) => `M${n1(r.hands[0][0] - 2.5)} ${n1(r.hands[0][1])}a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0`,
  },
  "russian-twist": {
    hip: [19, 38],
    torso: -118,
    legs: [[-28, 30], [-24, 34]],
    arms: [[22, -24]],
    env: () => floor(42),
  },
  "cable-woodchop": {
    hip: STAND,
    front: true,
    legs: [[104, 90], [76, 90]],
    arms: [{ to: [11, 5] }, { to: [12, 6], bend: -1 }],
    pulley: [4, 3],
  },
  "pallof-press": {
    hip: STAND,
    legs: [[90, 90], [92, 90]],
    arms: [[-2, -2]],
    pulley: [45, 13],
  },
  "dead-bug": {
    hip: [25, 39],
    torso: 180,
    legs: [[-90, 0], [-12, -12]],
    arms: [[-90, -90], [196, 196]],
    env: () => floor(42.5),
  },
  "mountain-climber": {
    ...plankHigh,
    legs: [[22, 22], [168, 104]],
  },

  // ------------------------------------------------------------ olympic + full body
  "power-clean": {
    hip: [19, 28],
    torso: -76,
    head: -60,
    legs: [{ to: [23, 44.5] }, { to: [21.5, 44.5] }],
    load: (r) => front(r, 5),
    arms: [toLoad(-1)],
  },
  "clean-and-jerk": {
    hip: [22, 28.5],
    scale: 0.9,
    legs: [{ to: [32, 44.5] }, { to: [12, 44.5], bend: -0.5 }],
    arms: [{ to: (r) => add(r.shoulder, 3.5, -11.5), bend: 1 }],
  },
  snatch: {
    hip: [24, 28.5],
    scale: 0.92,
    front: true,
    legs: [[128, 78]],
    arms: [[-138, -108]],
  },
  thruster: {
    hip: [21, 30],
    scale: 0.92,
    torso: -80,
    legs: [{ to: [25, 44.5] }, { to: [23.5, 44.5] }],
    arms: [{ to: (r) => add(r.shoulder, 2, -9), bend: 1 }],
  },
  "kettlebell-swing": {
    hip: [16, 27],
    torso: -58,
    legs: [{ to: [22, 44.5], bend: -0.6 }, { to: [20.5, 44.5], bend: -0.6 }],
    arms: [[-4, -4]],
  },
  "turkish-get-up": {
    hip: [22, 40],
    torso: -118,
    legs: [{ to: [32, 43], bend: -1 }, [4, 4]],
    arms: [[-92, -92], { to: [11, 43], bend: -1 }],
    env: () => floor(45.5),
  },
  burpee: {
    hip: [24, 25.5],
    scale: 0.9,
    front: true,
    legs: [[100, 96]],
    arms: [[-122, -112]],
    env: () => floor(46),
  },
  "box-jump": {
    hip: [16, 22],
    torso: -70,
    legs: [[8, 112], [14, 118]],
    arms: [[-34, -30]],
    env: () => "M26 33H43V45.5M26 33V45.5",
  },

  // ------------------------------------------------------------ cardio
  running: {
    hip: [23, 23.5],
    torso: -78,
    legs: [[30, 108], [128, 168]],
    arms: [[124, 36], [56, -30]],
  },
  walking: {
    hip: STAND,
    torso: -88,
    legs: [{ to: [30, 44.5] }, { to: [17, 44.5], bend: -0.3 }],
    arms: [[106, 96], [74, 66]],
  },
  cycling: {
    hip: [16, 23],
    torso: -44,
    legs: [{ to: [22, 39] }, { to: [16.5, 33.5] }],
    arms: [{ to: [32, 20.5] }],
    prop: () =>
      "M2 37a7 7 0 1 0 14 0a7 7 0 1 0-14 0M32 37a7 7 0 1 0 14 0a7 7 0 1 0-14 0M9 37L19 37L31 25.5L39 37M19 37L15.5 25M31 25.5L32 20",
  },
  "rowing-machine": {
    hip: [14, 38],
    torso: -100,
    legs: [[4, 4]],
    arms: [{ to: (r) => add(r.shoulder, 4.5, 3), bend: 1 }],
    env: () => "M3 41.5H44",
    prop: (r) => `M36 35a5 5 0 1 0 10 0a5 5 0 1 0-10 0M${n1(r.hands[0][0])} ${n1(r.hands[0][1])}L41 35`,
  },
  elliptical: {
    hip: [22, 24],
    torso: -86,
    legs: [{ to: [29, 42] }, { to: [15, 44] }],
    arms: [{ to: [32, 16] }, { to: [30, 19] }],
    prop: () => "M32 16L37 45M30 19L33 45M6 45.5H40",
  },
  "stair-climber": {
    hip: [21, 23],
    torso: -84,
    legs: [{ to: [28, 35.4] }, { to: [19, 39.4] }],
    arms: [{ to: [31, 19] }],
    env: () => "M12 45.5V41.2H23V37.2H33V33.2H44",
    prop: () => "M30 19L44 13",
  },
  "jump-rope": {
    hip: [24, 22.5],
    front: true,
    legs: [[94, 92]],
    arms: [[140, 110]],
    env: () => floor(46),
    prop: (r) => {
      const [a, b] = r.hands;
      return `M${n1(a[0])} ${n1(a[1])}C${n1(a[0] - 9)} 51 ${n1(b[0] + 9)} 51 ${n1(b[0])} ${n1(b[1])}`;
    },
  },
};

// Longest key first, so "lat-pulldown-close-grip" never matches "lat-pulldown".
const KEYS = Object.keys(POSES).sort((a, b) => b.length - a.length);
const ALIAS: Record<string, string> = { "lat-pulldown-close-grip": "lat-pulldown" };

function movementOf(slug: string): string | null {
  for (const k of [...Object.keys(ALIAS), ...KEYS]) {
    if (slug === k || slug.startsWith(`${k}-`)) return ALIAS[k] ?? k;
  }
  return null;
}

function kitOf(slug: string, equipment: string | null | undefined): Kit {
  if (slug.endsWith("-assisted")) return "assisted";
  if (slug.endsWith("-weighted")) return "weighted";
  return (equipment as Kit) || "bodyweight";
}

// ---------------------------------------------------------------- drawing
function dumbbell(h: P, fore: number, layer: Layer): Shape {
  const a = at(h, fore + 90, 2.8), b = at(h, fore - 90, 2.8);
  return {
    k: "path",
    layer,
    w: 2.4,
    d: `${L(a, b)}${L(at(a, fore, 2.4), at(a, fore + 180, 2.4))}${L(at(b, fore, 2.4), at(b, fore + 180, 2.4))}`,
  };
}
const plate = (c: P, r = 4.3, layer: Layer = "gear"): Shape[] => [
  { k: "dot", c, r, layer, w: 2.4 },
  { k: "dot", c, r: 1.1, layer, fill: true },
];
const handle = (h: P, fore: number, layer: Layer): Shape => ({ k: "path", layer, w: 2.4, d: L(at(h, fore + 90, 2.6), at(h, fore - 90, 2.6)) });

function frontBar(hands: P[]): Shape[] {
  const y = (hands[0][1] + hands[1][1]) / 2;
  const x1 = Math.min(hands[0][0], hands[1][0]) - 5, x2 = Math.max(hands[0][0], hands[1][0]) + 5;
  return [
    { k: "path", layer: "gear", w: 2, d: `M${n1(x1 - 2.5)} ${n1(y)}H${n1(x2 + 2.5)}` },
    { k: "path", layer: "gear", w: 3, d: `M${n1(x1)} ${n1(y - 4.5)}V${n1(y + 4.5)}M${n1(x2)} ${n1(y - 4.5)}V${n1(y + 4.5)}` },
  ];
}

const cache = new Map<string, Shape[]>();

/** The pictogram for an exercise, or null when its movement has no drawing. */
export function exerciseArt(ex: { slug?: string | null; equipment?: string | null }): Shape[] | null {
  const slug = ex.slug ?? "";
  const move = slug && movementOf(slug);
  if (!move) return null;
  const kit = kitOf(slug, ex.equipment);
  const key = `${move}|${kit}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const base = POSES[move];
  const pose: Pose = { ...base, ...(base.by?.[kit] ?? {}) };
  const r = rig(pose);
  const out: Shape[] = [];
  const far: Layer = pose.front ? "fig" : "far";
  const farGear: Layer = pose.front ? "gear" : "fargear";

  if (pose.env) out.push({ k: "path", d: pose.env(r), layer: "env" });
  if (kit === "smith_machine") {
    const xs = pose.front && r.hands.length > 1 ? r.hands.map((h) => h[0] + (h[0] < 24 ? -5 : 5)) : [(r.load ?? r.hands[0])[0]];
    out.push({ k: "path", d: xs.map((x) => `M${n1(x)} 2V46`).join(""), layer: "env" });
  }

  // cables go behind the figure
  if (kit === "cable") {
    const pulleys = Array.isArray(pose.pulley?.[0]) ? (pose.pulley as P[]) : [(pose.pulley as P | undefined) ?? [44, 4]];
    const hands = pose.front ? r.hands : r.hands.slice(0, 1);
    const ends = move === "glute-kickback" ? r.feet.slice(0, 1) : hands;
    ends.forEach((h, i) => {
      const p = pulleys[Math.min(i, pulleys.length - 1)];
      out.push({ k: "path", d: L(h, p), layer: "gear", w: 1.3 });
      out.push({ k: "path", d: `M${n1(p[0])} 1.5V46.5`, layer: "env" });
      out.push({ k: "dot", c: p, r: 1.9, layer: "gear", fill: true });
    });
  }

  const bar = kit === "barbell" || kit === "ez_bar" || kit === "trap_bar" || kit === "smith_machine";
  const overhead = r.dir[1] < -0.5 && r.hands.length > 0 && r.hands[0][1] < r.head[1];
  const behind = bar && !pose.front && (r.load !== null || overhead);
  if (behind) out.push(...plate(r.load ?? r.hands[0]));

  // far limbs, then the body, then near limbs
  const limb = (a: P, j: P, b: P, layer: Layer) => {
    // the halo starts a little away from the hip/shoulder so it doesn't notch the body
    if (layer === "fig") out.push({ k: "path", d: L(at(a, angle(a, j), 2.6), j, b), layer: "halo", w: 6 });
    out.push({ k: "path", d: L(a, j, b), layer });
  };
  r.knees.forEach((k, i) => i > 0 && limb(r.hip, k, r.feet[i], far));
  r.elbows.forEach((e, i) => i > 0 && limb(r.shoulder, e, r.hands[i], far));
  out.push({ k: "path", d: L(r.hip, r.neck), layer: "fig" });
  if (r.knees[0]) limb(r.hip, r.knees[0], r.feet[0], "fig");
  if (r.elbows[0]) limb(r.shoulder, r.elbows[0], r.hands[0], "fig");
  if (pose.toes !== undefined) r.feet.forEach((f, i) => out.push({ k: "path", d: L(f, at(f, pose.toes!, 3.4)), layer: i ? far : "fig" }));
  const headR = LEN.head * (pose.scale ?? 1);
  out.push({ k: "dot", c: r.head, r: headR + 1.3, layer: "halo", fill: true });
  out.push({ k: "dot", c: r.head, r: headR, layer: "fig", fill: true });

  if (pose.prop) out.push({ k: "path", d: pose.prop(r), layer: "gear", w: 2 });

  const fore = (i: number) => angle(r.elbows[i], r.hands[i]);
  switch (kit) {
    case "barbell":
    case "ez_bar":
    case "trap_bar":
    case "smith_machine":
      if (pose.front && r.hands.length > 1) out.push(...frontBar(r.hands));
      else if (!behind) out.push(...plate(r.hands[0]));
      break;
    case "plate":
      if (pose.front && r.hands.length > 1) out.push(...plate([(r.hands[0][0] + r.hands[1][0]) / 2, r.hands[0][1]], 4));
      else out.push(...plate(r.hands[0], 4));
      break;
    case "dumbbell":
      r.hands.forEach((h, i) => (i === 0 || move !== "goblet-squat") && out.push(dumbbell(h, fore(i), i ? farGear : "gear")));
      break;
    case "kettlebell":
      r.hands.slice(0, pose.front ? 2 : 1).forEach((h, i) => {
        const c = at(h, fore(i), 3.4);
        out.push({ k: "dot", c, r: 3.1, layer: "gear", w: 2.4 });
      });
      break;
    case "cable":
      (pose.front ? r.hands : r.hands.slice(0, 1)).forEach((h, i) => out.push(handle(h, fore(i), "gear")));
      break;
    case "machine":
      if (pose.machine) out.push({ k: "path", d: pose.machine(r), layer: "gear", w: 2.4 });
      break;
    case "weighted": {
      const c = r.load ?? add(r.hip, 0, 7);
      out.push({ k: "path", d: L(r.hip, c), layer: "gear", w: 1.3 });
      out.push(...plate(c, 3.4));
      break;
    }
    case "assisted":
    case "bodyweight":
    case "cardio":
      break;
  }

  cache.set(key, out);
  return out;
}
