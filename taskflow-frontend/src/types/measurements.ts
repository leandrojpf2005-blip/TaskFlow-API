// A logged measurement. All body fields are optional — a user can log just
// their weight one day and add tape measurements another. Append-only: each
// log is its own dated row, so the history builds a trend over time.
export interface Measurement {
  id: number;
  date: string; // ISO date, e.g. "2026-07-27"
  weight_kg: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
}

// POST body — send only the fields that were filled in.
export interface NewMeasurement {
  weight_kg?: number | null;
  chest_cm?: number | null;
  waist_cm?: number | null;
  arm_cm?: number | null;
  thigh_cm?: number | null;
}
