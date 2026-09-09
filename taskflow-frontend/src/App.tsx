import { useEffect, useState } from "react";
import { getSavedTheme, applyTheme, type ThemeKey } from "./lib/theme";
import * as authApi from "./api/auth";
import * as profileApi from "./api/profile";
import { getAuthToken } from "./api/client";
import type { User } from "./api/auth";
import type { Profile } from "./types/profile";

import { Welcome } from "./screens/Welcome";
import { Onboarding } from "./screens/Onboarding";
import { Home } from "./screens/Home";
import { Diary } from "./screens/Diary";
import { Workouts } from "./screens/Workouts";
import { ProfileScreen } from "./screens/ProfileScreen";
import { TabBar, type Tab } from "./components/TabBar";

export default function App() {
  const [theme, setTheme] = useState<ThemeKey>(getSavedTheme());
  useEffect(() => applyTheme(theme), [theme]);

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

  if (loading) return <div className="splash">Loading…</div>;
  if (!user) return <Welcome onAuthed={setUser} />;

  return (
    <Authed
      user={user}
      theme={theme}
      onThemeChange={setTheme}
      onLogout={() => {
        authApi.logout();
        setUser(null);
      }}
    />
  );
}

function Authed({
  user,
  theme,
  onThemeChange,
  onLogout,
}: {
  user: User;
  theme: ThemeKey;
  onThemeChange: (t: ThemeKey) => void;
  onLogout: () => void;
}) {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("home");
  const [addSignal, setAddSignal] = useState(0);

  useEffect(() => {
    profileApi
      .getProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  if (profile === undefined) return <div className="splash">Loading…</div>;
  if (profile === null) return <Onboarding username={user.username} onDone={setProfile} />;

  return (
    <div className="app-shell">
      <div className="screen">
        {tab === "home" && <Home user={user} profile={profile} />}
        {tab === "diary" && <Diary profile={profile} addSignal={addSignal} />}
        {tab === "workouts" && <Workouts />}
        {tab === "profile" && (
          <ProfileScreen
            user={user}
            profile={profile}
            theme={theme}
            onThemeChange={onThemeChange}
            onLogout={onLogout}
          />
        )}
      </div>
      <TabBar
        tab={tab}
        onTab={setTab}
        onAdd={() => {
          setTab("diary");
          setAddSignal((n) => n + 1);
        }}
      />
    </div>
  );
}
