import { useState } from "react";
import type { Activity, Profile, ProfileInput, Sex } from "../types/profile";

interface ProfileFormProps {
  initial?: Profile | null;
  submitLabel: string;
  onSubmit: (input: ProfileInput) => Promise<unknown>;
}

type Goal = "lose" | "maintain" | "gain";

const ACTIVITIES: { key: Activity; label: string }[] = [
  { key: "sedentary", label: "Sedentary — little or no exercise" },
  { key: "light", label: "Light — 1–3 days/week" },
  { key: "moderate", label: "Moderate — 3–5 days/week" },
  { key: "active", label: "Active — 6–7 days/week" },
  { key: "very_active", label: "Very active — hard daily / physical job" },
];

const RATES = [0.25, 0.5, 0.75, 1];

// Split a signed weekly_change_kg into (goal, rate) for the UI.
function toGoal(weekly: number | undefined): { goal: Goal; rate: number } {
  if (weekly === undefined || weekly === 0) return { goal: "maintain", rate: 0.5 };
  return weekly < 0 ? { goal: "lose", rate: Math.abs(weekly) } : { goal: "gain", rate: weekly };
}

export function ProfileForm({ initial, submitLabel, onSubmit }: ProfileFormProps) {
  const start = toGoal(initial?.weekly_change_kg);

  const [goal, setGoal] = useState<Goal>(start.goal);
  const [rate, setRate] = useState<number>(start.rate);
  const [weight, setWeight] = useState(initial?.weight_kg?.toString() ?? "");
  const [height, setHeight] = useState(initial?.height_cm?.toString() ?? "");
  const [age, setAge] = useState(initial?.age?.toString() ?? "");
  const [sex, setSex] = useState<Sex>(initial?.sex ?? "male");
  const [activity, setActivity] = useState<Activity>(initial?.activity ?? "moderate");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const w = Number(weight);
    const h = Number(height);
    const a = Number(age);
    if (!w || !h || !a) {
      setError("Please fill in weight, height and age.");
      return;
    }

    const weekly_change_kg = goal === "maintain" ? 0 : goal === "lose" ? -rate : rate;

    setBusy(true);
    try {
      await onSubmit({
        weight_kg: w,
        height_cm: h,
        age: a,
        sex,
        activity,
        weekly_change_kg,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="pf" onSubmit={submit}>
      {error && <div className="auth-error">{error}</div>}

      {/* Goal */}
      <div className="pf-block">
        <span className="pf-label">Goal</span>
        <div className="seg">
          {(["lose", "maintain", "gain"] as Goal[]).map((g) => (
            <button
              type="button"
              key={g}
              className={`seg-item ${goal === g ? "seg-item--active" : ""}`}
              onClick={() => setGoal(g)}
            >
              {g === "lose" ? "Lose" : g === "maintain" ? "Maintain" : "Gain"}
            </button>
          ))}
        </div>
      </div>

      {/* Rate (hidden for maintain) */}
      {goal !== "maintain" && (
        <div className="pf-block">
          <span className="pf-label">Pace ({goal === "lose" ? "lose" : "gain"} per week)</span>
          <div className="chips">
            {RATES.map((r) => (
              <button
                type="button"
                key={r}
                className={`chip ${rate === r ? "chip--active" : ""}`}
                onClick={() => setRate(r)}
              >
                {r} kg
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="pf-grid">
        <label className="field">
          <span>Weight (kg)</span>
          <input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </label>
        <label className="field">
          <span>Height (cm)</span>
          <input inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} />
        </label>
        <label className="field">
          <span>Age</span>
          <input inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
        </label>
      </div>

      {/* Sex */}
      <div className="pf-block">
        <span className="pf-label">Sex</span>
        <div className="seg">
          {(["male", "female"] as Sex[]).map((s) => (
            <button
              type="button"
              key={s}
              className={`seg-item ${sex === s ? "seg-item--active" : ""}`}
              onClick={() => setSex(s)}
            >
              {s === "male" ? "Male" : "Female"}
            </button>
          ))}
        </div>
      </div>

      {/* Activity */}
      <label className="field">
        <span>Activity level</span>
        <select
          className="pf-select"
          value={activity}
          onChange={(e) => setActivity(e.target.value as Activity)}
        >
          {ACTIVITIES.map((a) => (
            <option key={a.key} value={a.key}>
              {a.label}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" className="btn btn--primary pf-submit" disabled={busy}>
        {busy ? "Calculating…" : submitLabel}
      </button>
    </form>
  );
}
