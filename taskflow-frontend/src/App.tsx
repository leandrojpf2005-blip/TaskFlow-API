import { useMemo, useRef, useState } from "react";
import "./App.css";

import type { FoodEntry, NewFoodEntry, UpdateFoodEntry } from "./types/macros";
import { MEALS, MOCK_ENTRIES, TARGETS } from "./data/mockData";
import { sumEntries } from "./lib/totals";
import { todayISO } from "./lib/date";

import { Sidebar } from "./components/Sidebar";
import { DateNav } from "./components/DateNav";
import { DailySummary } from "./components/DailySummary";
import { MealSection } from "./components/MealSection";
import { EditFoodModal } from "./components/EditFoodModal";

// NOTE: State is local and seeded from mock data. The API layer in
// src/api/macros.ts is stubbed — swap these handlers for those calls once the
// backend is wired.
export default function App() {
  const [date, setDate] = useState(todayISO());
  const [entries, setEntries] = useState<FoodEntry[]>(MOCK_ENTRIES);
  const [editing, setEditing] = useState<FoodEntry | null>(null);

  // Fake auto-increment id for locally-created entries.
  const nextId = useRef(1000);

  const dayEntries = useMemo(
    () => entries.filter((e) => e.date === date),
    [entries, date],
  );

  const consumed = useMemo(() => sumEntries(dayEntries), [dayEntries]);

  const addEntry = (newEntry: NewFoodEntry) => {
    const meal = MEALS.find((m) => m.id === newEntry.meal_id);
    const entry: FoodEntry = {
      id: nextId.current++,
      date,
      meal_id: newEntry.meal_id,
      meal_name: meal?.name ?? "",
      food_name: newEntry.food_name,
      calories: newEntry.calories ?? 0,
      protein: newEntry.protein ?? 0,
      carbs: newEntry.carbs ?? 0,
      fat: newEntry.fat ?? 0,
    };
    setEntries((prev) => [...prev, entry]);
  };

  const deleteEntry = (id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const saveEdit = (id: number, changes: UpdateFoodEntry) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...changes } : e)),
    );
    setEditing(null);
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main">
        <header className="topbar">
          <div>
            <h1 className="page-title">Nutrition diary</h1>
            <p className="page-sub">Track meals against the day's targets</p>
          </div>
          <DateNav date={date} onChange={setDate} />
        </header>

        <DailySummary consumed={consumed} targets={TARGETS} />

        <div className="meals">
          {MEALS.map((meal) => (
            <MealSection
              key={meal.id}
              meal={meal}
              entries={dayEntries.filter((e) => e.meal_id === meal.id)}
              onAdd={addEntry}
              onDelete={deleteEntry}
              onEdit={setEditing}
            />
          ))}
        </div>
      </main>

      {editing && (
        <EditFoodModal
          entry={editing}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
