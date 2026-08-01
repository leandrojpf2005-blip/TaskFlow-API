import { useEffect, useMemo, useState } from "react";
import "./App.css";

import type { FoodEntry, Meal, MacroTargets, NewFoodEntry, UpdateFoodEntry } from "./types/macros";
import type { Profile, ProfileInput } from "./types/profile";
import { sumEntries } from "./lib/totals";
import { isToday, todayISO } from "./lib/date";
import { applyTheme, getSavedTheme, type ThemeKey } from "./lib/theme";
import * as macrosApi from "./api/macros";
import * as mealsApi from "./api/meals";
import * as authApi from "./api/auth";
import * as profileApi from "./api/profile";
import type { User } from "./api/auth";
import { getAuthToken } from "./api/client";

import { Landing } from "./components/Landing";
import { AuthScreen } from "./components/AuthScreen";
import { Onboarding } from "./components/Onboarding";
import { Sidebar } from "./components/Sidebar";
import { DateNav } from "./components/DateNav";
import { DailySummary } from "./components/DailySummary";
import { MealSection } from "./components/MealSection";
import { EditFoodModal } from "./components/EditFoodModal";
import { AddMealModal } from "./components/AddMealModal";
import { Settings } from "./components/Settings";
import { Measurements } from "./components/Measurements";

type View = "diary" | "measurements" | "settings";
type AuthMode = "login" | "register";

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong";
}

export default function App() {
  const [theme, setTheme] = useState<ThemeKey>(getSavedTheme());
  useEffect(() => applyTheme(theme), [theme]);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [stage, setStage] = useState<"landing" | "auth">("landing");
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  useEffect(() => {
    if (!getAuthToken()) {
      setAuthLoading(false);
      return;
    }
    authApi
      .getMe()
      .then(setUser)
      .catch(() => authApi.logout())
      .finally(() => setAuthLoading(false));
  }, []);

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setStage("auth");
  };

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    setStage("landing");
  };

  if (authLoading) {
    return <div className="splash">Loading…</div>;
  }

  if (!user) {
    return stage === "landing" ? (
      <Landing onLogin={() => openAuth("login")} onSignup={() => openAuth("register")} />
    ) : (
      <AuthScreen initialMode={authMode} onAuthed={setUser} onBack={() => setStage("landing")} />
    );
  }

  return <AuthedApp user={user} onLogout={handleLogout} theme={theme} onThemeChange={setTheme} />;
}

// Once signed in: load the profile. No profile -> onboarding; otherwise the diary.
function AuthedApp({
  user,
  onLogout,
  theme,
  onThemeChange,
}: {
  user: User;
  onLogout: () => void;
  theme: ThemeKey;
  onThemeChange: (t: ThemeKey) => void;
}) {
  // undefined = still loading, null = no profile yet
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    profileApi
      .getProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  if (profile === undefined) {
    return <div className="splash">Loading…</div>;
  }

  if (profile === null) {
    return <Onboarding username={user.username} onDone={setProfile} />;
  }

  return (
    <Diary
      user={user}
      profile={profile}
      onProfileChange={setProfile}
      onLogout={onLogout}
      theme={theme}
      onThemeChange={onThemeChange}
    />
  );
}

function Diary({
  user,
  profile,
  onProfileChange,
  onLogout,
  theme,
  onThemeChange,
}: {
  user: User;
  profile: Profile;
  onProfileChange: (p: Profile) => void;
  onLogout: () => void;
  theme: ThemeKey;
  onThemeChange: (t: ThemeKey) => void;
}) {
  const [view, setView] = useState<View>("diary");
  const [date, setDate] = useState(todayISO());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [addingMeal, setAddingMeal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const m = await mealsApi.getMeals();
        if (cancelled) return;
        setMeals(m);
        const day = await macrosApi.getDay(date);
        if (cancelled) return;
        setEntries(day);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(errMsg(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const orderedMeals = useMemo(() => [...meals].sort((a, b) => a.position - b.position), [meals]);
  const consumed = useMemo(() => sumEntries(entries), [entries]);

  // Real per-user targets from the computed plan.
  const targets: MacroTargets = {
    calories: profile.target_calories ?? 0,
    protein: profile.target_protein_g ?? 0,
    carbs: profile.target_carbs_g ?? 0,
    fat: profile.target_fat_g ?? 0,
  };

  const addEntry = async (newEntry: NewFoodEntry) => {
    try {
      const created = await macrosApi.createFoodEntry({ ...newEntry, date });
      setEntries((prev) => [...prev, created]);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const deleteEntry = async (id: number) => {
    try {
      await macrosApi.deleteFoodEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const saveEdit = async (id: number, changes: UpdateFoodEntry) => {
    try {
      const updated = await macrosApi.updateFoodEntry(id, changes);
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
      setEditing(null);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const addMeal = async (name: string, targetCalories: number | null = null) => {
    try {
      const position = meals.reduce((max, m) => Math.max(max, m.position), 0) + 1;
      const created = await mealsApi.createMeal({ name, position, target_calories: targetCalories });
      setMeals((prev) => [...prev, created]);
      setAddingMeal(false);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const updateMeal = async (
    id: number,
    changes: { name?: string; target_calories?: number | null },
  ) => {
    try {
      const updated = await mealsApi.updateMeal(id, changes);
      setMeals((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const deleteMeal = async (id: number) => {
    try {
      await mealsApi.deleteMeal(id);
      setMeals((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const saveProfile = async (input: ProfileInput) => {
    const updated = await profileApi.saveProfile(input);
    onProfileChange(updated);
    return updated;
  };

  const greeting = isToday(date) ? "Today's nutrition" : "Nutrition diary";

  return (
    <div className="app">
      <Sidebar user={user} view={view} onNavigate={setView} onAddMeal={() => setAddingMeal(true)} />

      <main className="main">
        {error && (
          <div className="banner">
            <span>{error}</span>
            <button className="banner-close" onClick={() => setError(null)} aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}

        {view === "settings" ? (
          <Settings
            user={user}
            profile={profile}
            onSaveProfile={saveProfile}
            onLogout={onLogout}
            theme={theme}
            onThemeChange={onThemeChange}
            meals={orderedMeals}
            onAddMeal={addMeal}
            onUpdateMeal={updateMeal}
            onDeleteMeal={deleteMeal}
          />
        ) : view === "measurements" ? (
          <Measurements user={user} />
        ) : (
          <>
            <header className="topbar">
              <div className="topbar-lead">
                <span className="eyebrow">CoachFuel · {user.username}</span>
                <h1 className="page-title">{greeting}</h1>
              </div>
              <DateNav date={date} onChange={setDate} />
            </header>

            <DailySummary consumed={consumed} targets={targets} />

            {loading ? (
              <div className="loading">Loading your day…</div>
            ) : (
              <div className="meals-grid">
                {orderedMeals.map((meal) => (
                  <MealSection
                    key={meal.id}
                    meal={meal}
                    entries={entries.filter((e) => e.meal_id === meal.id)}
                    onAdd={addEntry}
                    onDelete={deleteEntry}
                    onEdit={setEditing}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {editing && <EditFoodModal entry={editing} onSave={saveEdit} onClose={() => setEditing(null)} />}
      {addingMeal && <AddMealModal onSave={addMeal} onClose={() => setAddingMeal(false)} />}
    </div>
  );
}
