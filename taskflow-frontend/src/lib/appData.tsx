/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleCheck } from "lucide-react";
import * as mealsApi from "../api/meals";
import type { User } from "../api/auth";
import type { Meal } from "../types/macros";
import type { Profile } from "../types/profile";
import { todayIso } from "./dates";

// App-wide data the screens share: the signed-in user, their profile and
// meals, the diary day being viewed, a toast, and per-kind "versions" that a
// screen bumps after a write so every screen showing that data refetches.

export type DataKind = "diary" | "workouts" | "routines" | "measurements" | "recipes";

interface AppValue {
  user: User;
  profile: Profile;
  setProfile: (p: Profile) => void;
  meals: Meal[];
  reloadMeals: () => Promise<void>;
  /** The diary day the Home screen and the Log flow are working on. */
  date: string;
  setDate: (iso: string) => void;
  version: Record<DataKind, number>;
  bump: (kind: DataKind) => void;
  toast: (message: string) => void;
  logout: () => void;
}

const Ctx = createContext<AppValue | null>(null);

export function AppDataProvider({
  user,
  profile: initialProfile,
  onLogout,
  children,
}: {
  user: User;
  profile: Profile;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [date, setDate] = useState(todayIso);
  const [version, setVersion] = useState<Record<DataKind, number>>({
    diary: 0,
    workouts: 0,
    routines: 0,
    measurements: 0,
    recipes: 0,
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const reloadMeals = useCallback(async () => {
    try {
      const m = await mealsApi.getMeals();
      setMeals([...m].sort((a, b) => a.position - b.position));
    } catch {
      /* keep whatever we had */
    }
  }, []);

  useEffect(() => {
    let live = true;
    mealsApi
      .getMeals()
      .then((m) => live && setMeals([...m].sort((a, b) => a.position - b.position)))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const bump = useCallback((kind: DataKind) => {
    setVersion((v) => ({ ...v, [kind]: v[kind] + 1 }));
  }, []);

  const toast = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2400);
  }, []);

  const value = useMemo<AppValue>(
    () => ({
      user,
      profile,
      setProfile,
      meals,
      reloadMeals,
      date,
      setDate,
      version,
      bump,
      toast,
      logout: onLogout,
    }),
    [user, profile, meals, reloadMeals, date, version, bump, toast, onLogout],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {toastMsg && (
        <div className="toast" role="status">
          <CircleCheck />
          {toastMsg}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useApp(): AppValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside <AppDataProvider>");
  return v;
}
