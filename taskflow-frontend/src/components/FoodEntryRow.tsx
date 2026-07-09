import type { FoodEntry } from "../types/macros";

interface FoodEntryRowProps {
  entry: FoodEntry;
  onDelete: (id: number) => void;
  onEdit: (entry: FoodEntry) => void;
}

export function FoodEntryRow({ entry, onDelete, onEdit }: FoodEntryRowProps) {
  return (
    <div className="foodrow">
      <div className="foodrow-main">
        <span className="foodrow-name">{entry.food_name}</span>
        <div className="foodrow-macros">
          <span className="macro-pill macro-pill--protein">P {entry.protein ?? 0}</span>
          <span className="macro-pill macro-pill--carbs">C {entry.carbs ?? 0}</span>
          <span className="macro-pill macro-pill--fat">F {entry.fat ?? 0}</span>
        </div>
      </div>

      <span className="foodrow-cal">{entry.calories ?? 0}</span>

      <div className="foodrow-actions">
        <button className="icon-btn" onClick={() => onEdit(entry)} aria-label="Edit entry">
          ✎
        </button>
        <button
          className="icon-btn icon-btn--danger"
          onClick={() => onDelete(entry.id)}
          aria-label="Delete entry"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
