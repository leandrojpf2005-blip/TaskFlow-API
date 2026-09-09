import { IconHome, IconDiary, IconDumbbell, IconUser, IconPlus } from "./icons";

export type Tab = "home" | "diary" | "workouts" | "profile";

export function TabBar({
  tab,
  onTab,
  onAdd,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  onAdd: () => void;
}) {
  return (
    <nav className="tabbar">
      <button className={tab === "home" ? "on" : ""} onClick={() => onTab("home")} aria-label="Home">
        <IconHome />
      </button>
      <button className={tab === "diary" ? "on" : ""} onClick={() => onTab("diary")} aria-label="Diary">
        <IconDiary />
      </button>
      <button className="fab" onClick={onAdd} aria-label="Add food">
        <IconPlus />
      </button>
      <button
        className={tab === "workouts" ? "on" : ""}
        onClick={() => onTab("workouts")}
        aria-label="Workouts"
      >
        <IconDumbbell />
      </button>
      <button
        className={tab === "profile" ? "on" : ""}
        onClick={() => onTab("profile")}
        aria-label="Profile"
      >
        <IconUser />
      </button>
    </nav>
  );
}
