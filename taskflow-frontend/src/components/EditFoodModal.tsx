import { useState } from "react";
import type { FoodEntry, UpdateFoodEntry } from "../types/macros";

interface EditFoodModalProps {
  entry: FoodEntry;
  onSave: (id: number, changes: UpdateFoodEntry) => void;
  onClose: () => void;
}

export function EditFoodModal({ entry, onSave, onClose }: EditFoodModalProps) {
  const [form, setForm] = useState({
    food_name: entry.food_name,
    calories: entry.calories?.toString() ?? "",
    protein: entry.protein?.toString() ?? "",
    carbs: entry.carbs?.toString() ?? "",
    fat: entry.fat?.toString() ?? "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const toNum = (v: string) => (v.trim() === "" ? null : Number(v));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(entry.id, {
      food_name: form.food_name.trim(),
      calories: toNum(form.calories),
      protein: toNum(form.protein),
      carbs: toNum(form.carbs),
      fat: toNum(form.fat),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h3>Edit food</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <form className="modal-form" onSubmit={submit}>
          <label className="field">
            <span>Food name</span>
            <input value={form.food_name} onChange={set("food_name")} autoFocus />
          </label>

          <div className="field-grid">
            <label className="field">
              <span>Calories</span>
              <input inputMode="numeric" value={form.calories} onChange={set("calories")} />
            </label>
            <label className="field">
              <span>Protein (g)</span>
              <input inputMode="numeric" value={form.protein} onChange={set("protein")} />
            </label>
            <label className="field">
              <span>Carbs (g)</span>
              <input inputMode="numeric" value={form.carbs} onChange={set("carbs")} />
            </label>
            <label className="field">
              <span>Fat (g)</span>
              <input inputMode="numeric" value={form.fat} onChange={set("fat")} />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
