// Calendar-day helpers. Everything works on local dates; the backend stores
// diary and measurement days as plain DATE columns ("2026-10-13").

export function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const todayIso = () => isoDay(new Date());

/** Parse "YYYY-MM-DD" as a local date (new Date("2026-10-13") would be UTC). */
export function parseDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = parseDay(iso);
  d.setDate(d.getDate() + n);
  return isoDay(d);
}

/** Whole days from a to b (b − a), ignoring the time of day. */
export function daysBetween(a: Date, b: Date): number {
  const A = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const B = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((B - A) / 86_400_000);
}

/** 0 = Monday … 6 = Sunday. */
export const mondayIndex = (d: Date) => (d.getDay() + 6) % 7;

export function startOfWeek(d = new Date()): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - mondayIndex(s));
  return s;
}
