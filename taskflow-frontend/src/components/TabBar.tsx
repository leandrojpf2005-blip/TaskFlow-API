import { IconHome, IconDumbbell, IconTrend, IconMore, IconPlus } from "./icons";
import { useT } from "../lib/langHooks";
import type { Key } from "../lib/i18n";

export type Tab = "workouts" | "home" | "progress" | "more";

const TABS: { key: Tab; label: Key; icon: () => React.JSX.Element }[] = [
  { key: "workouts", label: "tab.workout", icon: IconDumbbell },
  { key: "home", label: "tab.home", icon: IconHome },
  { key: "progress", label: "tab.progress", icon: IconTrend },
  { key: "more", label: "tab.more", icon: IconMore },
];

export function TabBar({
  tab,
  onTab,
  onAdd,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  onAdd: () => void;
}) {
  const t = useT();
  // The FAB sits between Home and Progress, so the row is split either side of it.
  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  return (
    <nav className="tabbar">
      {left.map((item) => (
        <TabButton key={item.key} label={t(item.label)} icon={item.icon} active={tab === item.key} onClick={() => onTab(item.key)} />
      ))}

      <button className="fab-slot" onClick={onAdd} aria-label={t("tab.log")}>
        <span className="fab">
          <IconPlus />
        </span>
        <span className="tab-label">{t("tab.log")}</span>
      </button>

      {right.map((item) => (
        <TabButton key={item.key} label={t(item.label)} icon={item.icon} active={tab === item.key} onClick={() => onTab(item.key)} />
      ))}
    </nav>
  );
}

function TabButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: () => React.JSX.Element;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={active ? "on" : ""} onClick={onClick} aria-label={label} aria-current={active || undefined}>
      <Icon />
      <span className="tab-label">{label}</span>
      <span className="tab-dot" />
    </button>
  );
}
