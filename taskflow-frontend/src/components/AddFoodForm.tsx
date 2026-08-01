import { useState } from "react";
import type { NewFoodEntry } from "../types/macros";

interface AddFoodFormProps {
  mealId: number;
  onAdd: (entry: NewFoodEntry) => void;
  onCancel: () => void;
}

const EMPTY = { food_name: "", calories: "", protein: "", carbs: "", fat: "" };

export function AddFoodForm({ mealId, onAdd, onCancel }: AddFoodFormProps) {
  const [form, setForm] = useState(EMPTY);

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const toNum = (v: string) => (v.trim() === "" ? null : Number(v));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.food_name.trim()) return;
    onAdd({
      meal_id: mealId,
      food_name: form.food_name.trim(),
      calories: toNum(form.calories),
      protein: toNum(form.protein),
      carbs: toNum(form.carbs),
      fat: toNum(form.fat),
    });
    setForm(EMPTY);
  };

  return (
    <form className="quickadd" onSubmit={submit}>
      <input
        className="quickadd-name"
        placeholder="What did you eat?"
        value={form.food_name}
        onChange={set("food_name")}
        autoFocus
      />
      <div className="quickadd-nums">
        <input className="quickadd-num" placeholder="kcal" inputMode="numeric" value={form.calories} onChange={set("calories")} />
        <input className="quickadd-num" placeholder="P" inputMode="numeric" value={form.protein} onChange={set("protein")} />
        <input className="quickadd-num" placeholder="C" inputMode="numeric" value={form.carbs} onChange={set("carbs")} />
        <input className="quickadd-num" placeholder="F" inputMode="numeric" value={form.fat} onChange={set("fat")} />
      </div>
      <div className="quickadd-actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary btn--sm">
          Add
        </button>
      </div>
    </form>
  );
}
