import type { CSSProperties } from "react";
import type { ThemeKey } from "../lib/theme";
import type { Profile } from "../types/profile";
import type { User } from "../api/auth";

const rowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 0",
  borderBottom: "1px solid var(--line)",
  fontSize: 13.5,
  fontWeight: 600,
};

export function ProfileScreen({
  user,
  profile,
  theme,
  onThemeChange,
  onLogout,
}: {
  user: User;
  profile: Profile;
  theme: ThemeKey;
  onThemeChange: (t: ThemeKey) => void;
  onLogout: () => void;
}) {
  const goal = (n: number | null) => (n ?? 0).toLocaleString();

  return (
    <>
      <div className="appbar">
        <div>
          <p className="hi">Account</p>
          <p className="who">Profile</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "6px 0" }}>
        <div className="avatar" style={{ width: 70, height: 70, fontSize: 26 }}>
          {user.username.charAt(0).toUpperCase()}
        </div>
        <b style={{ fontSize: 19, fontWeight: 800 }}>{user.username}</b>
        <small style={{ color: "var(--muted)" }}>{user.email}</small>
      </div>

      <div className="sechead">
        <b>Daily goals</b>
      </div>
      <div className="gcard" style={{ padding: "2px 14px" }}>
        <div style={rowStyle}>
          <span>Calories</span>
          <b>{goal(profile.target_calories)} kcal</b>
        </div>
        <div style={rowStyle}>
          <span>Protein</span>
          <b>{goal(profile.target_protein_g)} g</b>
        </div>
        <div style={rowStyle}>
          <span>Carbs</span>
          <b>{goal(profile.target_carbs_g)} g</b>
        </div>
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <span>Fat</span>
          <b>{goal(profile.target_fat_g)} g</b>
        </div>
      </div>

      <div className="sechead">
        <b>Preferences</b>
      </div>
      <div className="gcard" style={{ padding: "2px 14px" }}>
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <span>Dark mode</span>
          <button
            onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle dark mode"
            style={{
              width: 46,
              height: 26,
              borderRadius: 20,
              border: "none",
              background: theme === "dark" ? "var(--accent)" : "var(--track)",
              position: "relative",
              transition: "background .2s",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: theme === "dark" ? 23 : 3,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                transition: "left .2s",
              }}
            />
          </button>
        </div>
      </div>

      <button className="btn" style={{ background: "var(--wcard)", color: "var(--wcard-fg)" }} onClick={onLogout}>
        Sign out
      </button>
    </>
  );
}
