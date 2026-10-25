import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import * as authApi from "./api/auth";
import * as profileApi from "./api/profile";
import { getAuthToken } from "./api/client";
import type { User } from "./api/auth";
import type { Profile } from "./types/profile";
import { useLang } from "./lib/langHooks";
import { PrefsProvider } from "./lib/prefs";
import { AppDataProvider, useApp } from "./lib/appData";
import { loadRecents } from "./lib/recents";
import { loadCatalogue } from "./lib/exercises";
import { SessionProvider, useSession, useTick } from "./lib/session";
import { NavProvider, useNav } from "./lib/nav";
import { TabBar } from "./components/TabBar";
import { Welcome } from "./screens/Welcome";
import { Onboarding } from "./screens/Onboarding";
import { Home } from "./screens/Home";
import { WorkoutTab } from "./screens/workout/WorkoutTab";
import { Session } from "./screens/workout/Session";
import { ProgressTab } from "./screens/progress/ProgressTab";
import { MoreTab } from "./screens/more/MoreTab";
import { LogHub } from "./screens/log/LogHub";

export default function App() {
  const { t } = useLang();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => !!getAuthToken());

  useEffect(() => {
    if (!getAuthToken()) return;
    authApi
      .getMe()
      .then(setUser)
      .catch(() => authApi.logout())
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="splash">{t("common.loading")}</div>;
  if (!user) return <Welcome onAuthed={setUser} />;

  return (
    <PrefsProvider userId={user.id} key={user.id}>
      <Authed
        user={user}
        onLogout={() => {
          authApi.logout();
          setUser(null);
        }}
      />
    </PrefsProvider>
  );
}

function Authed({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { t } = useLang();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    profileApi
      .getProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  if (profile === undefined) return <div className="splash">{t("common.loading")}</div>;
  if (profile === null) return <Onboarding username={user.username} onDone={setProfile} />;

  return (
    <AppDataProvider user={user} profile={profile} onLogout={onLogout}>
      <SessionProvider userId={user.id}>
        <NavProvider>
          <Shell />
        </NavProvider>
      </SessionProvider>
    </AppDataProvider>
  );
}

/** Tabs underneath, pushed screens on top, bottom bar and the live-workout pill. */
function Shell() {
  const nav = useNav();
  const { version } = useApp();

  // Warm the recent-foods cache once the first screen has loaded, so the Log
  // flow opens with its list ready (it is derived from 14 days of diary).
  useEffect(() => {
    const id = window.setTimeout(() => void loadRecents(version.diary), 1500);
    return () => window.clearTimeout(id);
  }, [version.diary]);

  // Same for the exercise library (translated names, picker).
  useEffect(() => {
    const id = window.setTimeout(() => void loadCatalogue().catch(() => undefined), 2000);
    return () => window.clearTimeout(id);
  }, []);

  const top = nav.stack[nav.stack.length - 1];
  const showTabs = !top || top.chrome === "tabs";
  const { session } = useSession();
  const sessionOpen = nav.stack.some((e) => (e.node as { type?: unknown })?.type === Session);
  const showMini = !!session && showTabs && !sessionOpen;

  const openLog = () => {
    nav.popToRoot();
    nav.push(<LogHub />, "tabs");
  };

  return (
    <div className={`app${showMini ? " has-mini" : ""}`}>
      <div className={top ? "hidden" : ""}>
        {nav.tab === "home" && <Home />}
        {nav.tab === "workouts" && <WorkoutTab />}
        {nav.tab === "progress" && <ProgressTab />}
        {nav.tab === "more" && <MoreTab />}
      </div>
      {nav.stack.map((e, i) => (
        <div key={e.id} className={i === nav.stack.length - 1 ? "" : "hidden"}>
          {e.node}
        </div>
      ))}
      {showMini && <MiniSession />}
      {showTabs && <TabBar onLog={openLog} />}
    </div>
  );
}

function MiniSession() {
  const { t } = useLang();
  const nav = useNav();
  const { session } = useSession();
  const now = useTick(!!session);
  if (!session) return null;
  const mins = Math.floor((now - session.startedAt) / 60000);
  const done = session.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0);
  return (
    <button className="mini-session" onClick={() => nav.push(<Session />)}>
      <i className="rec-dot" />
      <span className="grow">
        <b>{session.name}</b>
        <small>
          {t("workout.inProgress")} · {mins} min · {t("workout.setsCount", { n: done })}
        </small>
      </span>
      <span className="go">
        <Activity size={15} style={{ verticalAlign: "-2px", marginRight: 4 }} />
        {t("workout.resume")}
      </span>
    </button>
  );
}
