import { useState, type FormEvent } from "react";
import { saveProfile } from "../api/profile";
import * as mealsApi from "../api/meals";
import type { Profile, Sex, Activity } from "../types/profile";

const DEFAULT_MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks"];

const ACTIVITIES: { key: Activity; label: string }[] = [
  { key: "sedentary", label: "Sedentary" },
  { key: "light", label: "Light" },
  { key: "moderate", label: "Moderate" },
  { key: "active", label: "Active" },
  { key: "very_active", label: "Very active" },
];

const GOALS: { label: string; value: number }[] = [
  { label: "Lose", value: -0.5 },
  { label: "Maintain", value: 0 },
  { label: "Gain", value: 0.25 },
];

export function Onboarding({
  username,
  onDone,
}: {
  username: string;
  onDone: (p: Profile) => void;
}) {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex>("male");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [weekly, setWeekly] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const p = await saveProfile({
        weight_kg: Number(weight),
        height_cm: Number(height),
        age: Number(age),
        sex,
        activity,
        weekly_change_kg: weekly,
      });
      // Seed default meals so the diary is usable right away (a new user has none).
      const per = Math.round((p.target_calories ?? 2000) / DEFAULT_MEALS.length);
      for (let i = 0; i < DEFAULT_MEALS.length; i++) {
        try {
          await mealsApi.createMeal({ name: DEFAULT_MEALS[i], position: i + 1, target_calories: per });
        } catch {
          /* non-fatal: user can still proceed */
        }
      }
      onDone(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <form className="app-shell" onSubmit={submit}>
      <div className="screen">
        <div className="appbar">
          <div>
            <p className="hi">Welcome, {username}</p>
            <p className="who">Set up your plan</p>
          </div>
        </div>

        {error && <div className="banner">{error}</div>}

        <div className="field">
          <label>Weight (kg)</label>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Height (cm)</label>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Age</label>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label>Sex</label>
          <div className="seg">
            {(["male", "female"] as Sex[]).map((s) => (
              <button
                type="button"
                key={s}
                className={sex === s ? "on" : ""}
                onClick={() => setSex(s)}
              >
                {s === "male" ? "Male" : "Female"}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Activity level</label>
          <div className="seg">
            {ACTIVITIES.map((a) => (
              <button
                type="button"
                key={a.key}
                className={activity === a.key ? "on" : ""}
                onClick={() => setActivity(a.key)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Goal</label>
          <div className="seg">
            {GOALS.map((g) => (
              <button
                type="button"
                key={g.label}
                className={weekly === g.value ? "on" : ""}
                onClick={() => setWeekly(g.value)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Building your plan…" : "Start tracking"}
        </button>
      </div>
    </form>
  );
}
