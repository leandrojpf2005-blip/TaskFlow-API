import { useState, type FormEvent } from "react";
import type { NewFoodEntry } from "../types/macros";

// Manual food entry (name + macros). Stage 3 adds search over the food DB on top.
export function AddFoodSheet({
  mealId,
  mealName,
  onAdd,
  onClose,
}: {
  mealId: number;
  mealName: string;
  onAdd: (e: NewFoodEntry) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onAdd({
        meal_id: mealId,
        food_name: name.trim(),
        calories: num(calories),
        protein: num(protein),
        carbs: num(carbs),
        fat: num(fat),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="sheet-handle" />
        <h3>Add to {mealName}</h3>
        {error && <div className="banner">{error}</div>}
        <div className="field">
          <label>Food name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label>Calories</label>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />
        </div>
        <div className="grid3">
          <div className="field">
            <label>Protein</label>
            <input className="input" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
          </div>
          <div className="field">
            <label>Carbs</label>
            <input className="input" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          </div>
          <div className="field">
            <label>Fat</label>
            <input className="input" type="number" value={fat} onChange={(e) => setFat(e.target.value)} />
          </div>
        </div>
        <button className="btn" type="submit" disabled={busy || !name.trim()}>
          {busy ? "Adding…" : "Add food"}
        </button>
      </form>
    </div>
  );
}
