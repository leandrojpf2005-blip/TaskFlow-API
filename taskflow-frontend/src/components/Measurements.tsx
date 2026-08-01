import { useEffect, useState } from "react";
import type { User } from "../api/auth";
import type { Measurement, NewMeasurement } from "../types/measurements";
import * as measurementsApi from "../api/measurements";
import { round1 } from "../lib/format";
import { WeightTrend } from "./WeightTrend";

const FIELDS = [
  { key: "weight_kg", label: "Weight", unit: "kg" },
  { key: "chest_cm", label: "Chest", unit: "cm" },
  { key: "waist_cm", label: "Waist", unit: "cm" },
  { key: "arm_cm", label: "Arm", unit: "cm" },
  { key: "thigh_cm", label: "Thigh", unit: "cm" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];
type FormState = Record<FieldKey, string>;

const EMPTY_FORM: FormState = {
  weight_kg: "",
  chest_cm: "",
  waist_cm: "",
  arm_cm: "",
  thigh_cm: "",
};

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function Measurements({ user }: { user: User }) {
  const [items, setItems] = useState<Measurement[] | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    measurementsApi
      .getMeasurements()
      .then(setItems)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Couldn't load measurements");
        setItems([]);
      });
  }, []);

  const setField = (key: FieldKey, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: NewMeasurement = {};
    for (const { key, label } of FIELDS) {
      const raw = form[key].trim();
      if (raw === "") continue;
      const num = Number(raw);
      if (Number.isNaN(num) || num <= 0) {
        setError(`${label} must be a number.`);
        return;
      }
      payload[key] = num;
    }

    if (Object.keys(payload).length === 0) {
      setError("Fill in at least one measurement.");
      return;
    }

    setBusy(true);
    try {
      const created = await measurementsApi.createMeasurement(payload);
      setItems((prev) => [...(prev ?? []), created]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save measurement");
    } finally {
      setBusy(false);
    }
  };

  const history = [...(items ?? [])].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id,
  );

  return (
    <>
      <header className="topbar">
        <div className="topbar-lead">
          <span className="eyebrow">CoachFuel · {user.username}</span>
          <h1 className="page-title">Measurements</h1>
        </div>
      </header>

      <div className="settings">
        {/* Log form */}
        <section className="setting-card">
          <div className="setting-head">
            <div>
              <h2 className="setting-title">Log a measurement</h2>
              <p className="setting-desc">
                Fill in whatever you measured today — the rest stays blank. Each log is
                saved as a new dated entry.
              </p>
            </div>
          </div>

          <form onSubmit={submit}>
            {error && <div className="auth-error">{error}</div>}
            <div className="meas-form-grid">
              {FIELDS.map(({ key, label, unit }) => (
                <label className="field" key={key}>
                  <span>
                    {label} ({unit})
                  </span>
                  <input
                    inputMode="decimal"
                    placeholder="—"
                    value={form[key]}
                    onChange={(e) => setField(key, e.target.value)}
                  />
                </label>
              ))}
            </div>
            <button type="submit" className="btn btn--primary meas-submit" disabled={busy}>
              {busy ? "Saving…" : "Save measurement"}
            </button>
          </form>
        </section>

        {/* Weight trend */}
        <section className="setting-card">
          <div className="setting-head">
            <div>
              <h2 className="setting-title">Weight trend</h2>
              <p className="setting-desc">Every weigh-in you've logged, over time.</p>
            </div>
          </div>
          {items === null ? (
            <div className="loading">Loading…</div>
          ) : (
            <WeightTrend measurements={items} />
          )}
        </section>

        {/* History */}
        <section className="setting-card">
          <div className="setting-head">
            <div>
              <h2 className="setting-title">History</h2>
              <p className="setting-desc">{history.length} entries logged.</p>
            </div>
          </div>

          {items === null ? (
            <div className="loading">Loading…</div>
          ) : history.length === 0 ? (
            <p className="meas-empty">No measurements yet. Log your first one above.</p>
          ) : (
            <ul className="meas-history">
              {history.map((m) => (
                <li key={m.id} className="meas-row">
                  <span className="meas-date">{fmtDate(m.date)}</span>
                  <div className="meas-vals">
                    {FIELDS.map(({ key, label, unit }) =>
                      m[key] != null ? (
                        <span className="meas-chip" key={key}>
                          <span className="meas-chip-label">{label}</span>
                          {round1(m[key] as number)}
                          {unit}
                        </span>
                      ) : null,
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
