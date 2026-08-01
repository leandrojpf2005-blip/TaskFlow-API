import { useState } from "react";
import type { FoodEntry, Meal, NewFoodEntry } from "../types/macros";
import { sumEntries } from "../lib/totals";
import { FoodEntryRow } from "./FoodEntryRow";
import { AddFoodForm } from "./AddFoodForm";

interface MealSectionProps {
  meal: Meal;
  entries: FoodEntry[];
  onAdd: (entry: NewFoodEntry) => void;
  onDelete: (id: number) => void;
  onEdit: (entry: FoodEntry) => void;
}

// Emoji accent per default meal, falls back to a plate for custom meals.
const MEAL_ICON: Record<string, string> = {
  Breakfast: "🌅",
  Lunch: "🥗",
  Snack: "🍎",
  Dinner: "🌙",
};

export function MealSection({ meal, entries, onAdd, onDelete, onEdit }: MealSectionProps) {
  const [adding, setAdding] = useState(false);
  const totals = sumEntries(entries);

  const handleAdd = (entry: NewFoodEntry) => {
    onAdd(entry);
    setAdding(false);
  };

  return (
    <section className="mealcard">
      <header className="mealcard-head">
        <div className="mealcard-title">
          <span className="mealcard-icon" aria-hidden>
            {MEAL_ICON[meal.name] ?? "🍽"}
          </span>
          <h3>{meal.name}</h3>
        </div>
        <span className="mealcard-cal">{totals.calories} kcal</span>
      </header>

      <div className="mealcard-body">
        {entries.length === 0 && !adding && <p className="mealcard-empty">Nothing logged</p>}

        {entries.map((entry) => (
          <FoodEntryRow key={entry.id} entry={entry} onDelete={onDelete} onEdit={onEdit} />
        ))}

        {adding ? (
          <AddFoodForm mealId={meal.id} onAdd={handleAdd} onCancel={() => setAdding(false)} />
        ) : (
          <button className="mealcard-add" onClick={() => setAdding(true)}>
            <span aria-hidden>＋</span> Add food
          </button>
        )}
      </div>
    </section>
  );
}
