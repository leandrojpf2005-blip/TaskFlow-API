import type { FoodEntry } from "../types/macros";
import { round1 } from "../lib/format";

interface FoodEntryRowProps {
  entry: FoodEntry;
  onDelete: (id: number) => void;
  onEdit: (entry: FoodEntry) => void;
}

export function FoodEntryRow({ entry, onDelete, onEdit }: FoodEntryRowProps) {
  return (
    <div className="foodrow">
      <button className="foodrow-body" onClick={() => onEdit(entry)}>
        <span className="foodrow-name">{entry.food_name}</span>
        <div className="foodrow-macros">
          <span className="dot dot--protein" /> {round1(entry.protein ?? 0)}p
          <span className="dot dot--carbs" /> {round1(entry.carbs ?? 0)}c
          <span className="dot dot--fat" /> {round1(entry.fat ?? 0)}f
        </div>
      </button>

      <span className="foodrow-cal">
        {entry.calories ?? 0}
        <span className="foodrow-cal-unit">kcal</span>
      </span>

      <button
        className="foodrow-del"
        onClick={() => onDelete(entry.id)}
        aria-label={`Delete ${entry.food_name}`}
      >
        ✕
      </button>
    </div>
  );
}
