// Left navigation. The coaching app will grow into these sections; only the
// Diary (macro tracker) is built today, so the rest are shown as "soon".

interface NavItem {
  key: string;
  label: string;
  icon: string;
  ready: boolean;
}

const NAV: NavItem[] = [
  { key: "diary", label: "Diary", icon: "🍽️", ready: true },
  { key: "clients", label: "Clients", icon: "👥", ready: false },
  { key: "workouts", label: "Workouts", icon: "🏋️", ready: false },
  { key: "messages", label: "Messages", icon: "💬", ready: false },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">CF</span>
        <span className="brand-name">CoachFuel</span>
      </div>

      <nav className="nav">
        {NAV.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${item.ready ? "" : "nav-item--soon"} ${
              item.key === "diary" ? "nav-item--active" : ""
            }`}
            disabled={!item.ready}
          >
            <span className="nav-icon" aria-hidden>
              {item.icon}
            </span>
            <span>{item.label}</span>
            {!item.ready && <span className="nav-badge">soon</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="client-chip">
          <span className="client-avatar" aria-hidden>
            JD
          </span>
          <div className="client-meta">
            <strong>Jordan Doe</strong>
            <span>Cutting · Week 3</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
