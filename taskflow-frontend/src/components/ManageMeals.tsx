import { useState } from "react";
import type { Meal } from "../types/macros";

interface ManageMealsProps {
  meals: Meal[];
  onAdd: (name: string, targetCalories: number | null) => void;
  onUpdate: (id: number, changes: { name?: string; target_calories?: number | null }) => void;
  onDelete: (id: number) => void;
}

// One editable row per meal. Keeps its own draft state; "Save" only enables
// when something actually changed.
function MealRow({
  meal,
  onUpdate,
  onDelete,
}: {
  meal: Meal;
  onUpdate: ManageMealsProps["onUpdate"];
  onDelete: ManageMealsProps["onDelete"];
}) {
  const [name, setName] = useState(meal.name);
  const [target, setTarget] = useState(meal.target_calories?.toString() ?? "");

  const targetNum = target.trim() === "" ? null : Number(target);
  const changed = name.trim() !== meal.name || targetNum !== meal.target_calories;

  return (
    <div className="mm-row">
      <span className="mm-pos">{meal.position}</span>
      <input className="mm-name" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="mm-target">
        <input
          className="mm-target-input"
          inputMode="numeric"
          placeholder="—"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <span className="mm-unit">kcal</span>
      </div>
      <button
        className="btn btn--primary btn--sm"
        disabled={!changed || !name.trim()}
        onClick={() => onUpdate(meal.id, { name: name.trim(), target_calories: targetNum })}
      >
        Save
      </button>
      <button className="mm-del" onClick={() => onDelete(meal.id)} aria-label={`Delete ${meal.name}`}>
        ✕
      </button>
    </div>
  );
}

export function ManageMeals({ meals, onAdd, onUpdate, onDelete }: ManageMealsProps) {
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");

  const dailyTotal = meals.reduce((sum, m) => sum + (m.target_calories ?? 0), 0);

  const submitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAdd(newName.trim(), newTarget.trim() === "" ? null : Number(newTarget));
    setNewName("");
    setNewTarget("");
  };

  return (
    <section className="setting-card">
      <div className="setting-head">
        <div>
          <h2 className="setting-title">Manage meals</h2>
          <p className="setting-desc">
            Rename meals, reorder by position, and set a calorie target for each.
          </p>
        </div>
        <span className="setting-total">{dailyTotal} kcal / day</span>
      </div>

      <div className="mm-list">
        <div className="mm-row mm-row--head">
          <span className="mm-pos">#</span>
          <span>Meal</span>
          <span>Target</span>
          <span />
          <span />
        </div>

        {meals.map((meal) => (
          <MealRow key={meal.id} meal={meal} onUpdate={onUpdate} onDelete={onDelete} />
        ))}
      </div>

      <form className="mm-add" onSubmit={submitNew}>
        <span className="mm-pos" aria-hidden>
          ＋
        </span>
        <input
          className="mm-name"
          placeholder="New meal name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <div className="mm-target">
          <input
            className="mm-target-input"
            inputMode="numeric"
            placeholder="—"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
          />
          <span className="mm-unit">kcal</span>
        </div>
        <button type="submit" className="btn btn--primary btn--sm" disabled={!newName.trim()}>
          Add
        </button>
        <span />
      </form>
    </section>
  );
}
