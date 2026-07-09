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

export function MealSection({ meal, entries, onAdd, onDelete, onEdit }: MealSectionProps) {
  const [adding, setAdding] = useState(false);
  const totals = sumEntries(entries);

  const handleAdd = (entry: NewFoodEntry) => {
    onAdd(entry);
    setAdding(false);
  };

  return (
    <section className="meal card">
      <header className="meal-head">
        <h3 className="meal-title">{meal.name}</h3>
        <span className="meal-cal">{totals.calories} kcal</span>
      </header>

      <div className="meal-body">
        {entries.length === 0 && !adding && (
          <p className="meal-empty">Nothing logged yet.</p>
        )}

        {entries.map((entry) => (
          <FoodEntryRow key={entry.id} entry={entry} onDelete={onDelete} onEdit={onEdit} />
        ))}

        {adding ? (
          <AddFoodForm mealId={meal.id} onAdd={handleAdd} onCancel={() => setAdding(false)} />
        ) : (
          <button className="meal-add" onClick={() => setAdding(true)}>
            + Add food
          </button>
        )}
      </div>
    </section>
  );
}
