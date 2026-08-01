import type { Meal } from "../types/macros";
import type { Profile, ProfileInput } from "../types/profile";
import type { User } from "../api/auth";
import { THEMES, type ThemeKey } from "../lib/theme";
import { round1 } from "../lib/format";
import { ManageMeals } from "./ManageMeals";
import { ProfileForm } from "./ProfileForm";

interface SettingsProps {
  user: User;
  profile: Profile;
  onSaveProfile: (input: ProfileInput) => Promise<Profile>;
  onLogout: () => void;
  theme: ThemeKey;
  onThemeChange: (t: ThemeKey) => void;
  meals: Meal[];
  onAddMeal: (name: string, targetCalories: number | null) => void;
  onUpdateMeal: (id: number, changes: { name?: string; target_calories?: number | null }) => void;
  onDeleteMeal: (id: number) => void;
}

export function Settings({
  user,
  profile,
  onSaveProfile,
  onLogout,
  theme,
  onThemeChange,
  meals,
  onAddMeal,
  onUpdateMeal,
  onDeleteMeal,
}: SettingsProps) {
  return (
    <>
      <header className="topbar">
        <div className="topbar-lead">
          <span className="eyebrow">CoachFuel · {user.username}</span>
          <h1 className="page-title">Settings</h1>
        </div>
      </header>

      <div className="settings">
        {/* Account */}
        <section className="setting-card">
          <div className="setting-head">
            <div>
              <h2 className="setting-title">Account</h2>
              <p className="setting-desc">You're signed in.</p>
            </div>
            <button className="btn btn--ghost btn--sm" onClick={onLogout}>
              Log out
            </button>
          </div>
          <div className="account-rows">
            <div className="account-row">
              <span>Username</span>
              <strong>{user.username}</strong>
            </div>
            <div className="account-row">
              <span>Email</span>
              <strong>{user.email}</strong>
            </div>
          </div>
        </section>

        {/* Daily targets — the computed plan (read-only) */}
        <section className="setting-card">
          <div className="setting-head">
            <div>
              <h2 className="setting-title">Daily targets</h2>
              <p className="setting-desc">Calculated from your profile below.</p>
            </div>
          </div>
          <div className="target-tiles">
            <div className="target-tile">
              <span className="target-num">{profile.target_calories ?? "—"}</span>
              <span className="target-lbl">kcal</span>
            </div>
            <div className="target-tile">
              <span className="target-num" style={{ color: "var(--protein)" }}>
                {round1(profile.target_protein_g ?? 0)}
              </span>
              <span className="target-lbl">protein (g)</span>
            </div>
            <div className="target-tile">
              <span className="target-num" style={{ color: "var(--carbs)" }}>
                {round1(profile.target_carbs_g ?? 0)}
              </span>
              <span className="target-lbl">carbs (g)</span>
            </div>
            <div className="target-tile">
              <span className="target-num" style={{ color: "var(--fat)" }}>
                {round1(profile.target_fat_g ?? 0)}
              </span>
              <span className="target-lbl">fat (g)</span>
            </div>
          </div>
        </section>

        {/* Profile — editable; saving recomputes the plan */}
        <section className="setting-card">
          <div className="setting-head">
            <div>
              <h2 className="setting-title">Profile</h2>
              <p className="setting-desc">
                Update your stats or goal — your targets recalculate automatically.
              </p>
            </div>
          </div>
          <ProfileForm initial={profile} submitLabel="Save & recalculate" onSubmit={onSaveProfile} />
        </section>

        {/* Appearance */}
        <section className="setting-card">
          <div className="setting-head">
            <div>
              <h2 className="setting-title">Appearance</h2>
              <p className="setting-desc">Pick how CoachFuel looks. Saved on this device.</p>
            </div>
          </div>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.key}
                className={`theme-option ${theme === t.key ? "theme-option--active" : ""}`}
                onClick={() => onThemeChange(t.key)}
                aria-pressed={theme === t.key}
              >
                <span className="theme-dots" aria-hidden>
                  {t.dots.map((c, i) => (
                    <span key={i} className="theme-dot" style={{ background: c }} />
                  ))}
                </span>
                <span className="theme-name">{t.label}</span>
                <span className="theme-tagline">{t.tagline}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Manage meals */}
        <ManageMeals
          meals={meals}
          onAdd={onAddMeal}
          onUpdate={onUpdateMeal}
          onDelete={onDeleteMeal}
        />
      </div>
    </>
  );
}
