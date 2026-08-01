import type { User } from "../api/auth";

// Slim icon rail. Diary + Settings are live; the rest are placeholders for the
// wider coaching app. Settings is opened from the profile avatar at the bottom.

type View = "diary" | "measurements" | "settings";

interface SidebarProps {
  user: User;
  view: View;
  onNavigate: (view: View) => void;
  onAddMeal: () => void;
}

interface NavItem {
  key: string;
  label: string;
  icon: string;
  ready: boolean;
  view?: View;
}

const NAV: NavItem[] = [
  { key: "diary", label: "Diary", icon: "🍽", ready: true, view: "diary" },
  { key: "measurements", label: "Measurements", icon: "📏", ready: true, view: "measurements" },
  { key: "workouts", label: "Workouts", icon: "🏋", ready: false },
  { key: "messages", label: "Messages", icon: "💬", ready: false },
];

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase() || "?";
}

export function Sidebar({ user, view, onNavigate, onAddMeal }: SidebarProps) {
  return (
    <aside className="rail">
      <div className="rail-brand" title="CoachFuel">
        CF
      </div>

      <nav className="rail-nav">
        {NAV.map((item) => (
          <button
            key={item.key}
            className={`rail-item ${item.view && item.view === view ? "rail-item--active" : ""}`}
            disabled={!item.ready}
            title={item.ready ? item.label : `${item.label} — coming soon`}
            onClick={() => item.view && onNavigate(item.view)}
          >
            <span aria-hidden>{item.icon}</span>
            <span className="rail-tip">{item.label}</span>
          </button>
        ))}

        <button className="rail-item rail-add" onClick={onAddMeal} title="Quick add meal">
          <span aria-hidden>＋</span>
          <span className="rail-tip">Quick add meal</span>
        </button>
      </nav>

      {/* Profile avatar = Settings entry point */}
      <button
        className={`rail-avatar ${view === "settings" ? "rail-avatar--active" : ""}`}
        onClick={() => onNavigate("settings")}
        title={`${user.username} — Settings`}
      >
        {initials(user.username)}
        <span className="rail-tip">Settings</span>
      </button>
    </aside>
  );
}
