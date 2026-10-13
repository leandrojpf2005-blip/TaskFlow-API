import { Dumbbell, Ellipsis, House, Plus, TrendingUp, type LucideIcon } from "lucide-react";
import { useNav, type Tab } from "../lib/nav";
import { useLang } from "../lib/langHooks";
import type { Key } from "../lib/i18n";

const LEFT: { key: Tab; label: Key; icon: LucideIcon }[] = [
  { key: "workouts", label: "tab.workout", icon: Dumbbell },
  { key: "home", label: "tab.home", icon: House },
];
const RIGHT: { key: Tab; label: Key; icon: LucideIcon }[] = [
  { key: "progress", label: "tab.progress", icon: TrendingUp },
  { key: "more", label: "tab.more", icon: Ellipsis },
];

/** Workout · Home · (+ Log) · Progress · More — the mockup's bottom bar. */
export function TabBar({ onLog }: { onLog: () => void }) {
  const { t } = useLang();
  const nav = useNav();

  const item = ({ key, label, icon: Icon }: (typeof LEFT)[number]) => (
    <button
      key={key}
      className={nav.tab === key ? "on" : ""}
      onClick={() => nav.goTab(key)}
      aria-current={nav.tab === key ? "page" : undefined}
    >
      <Icon />
      {t(label)}
      <span className="dot" />
    </button>
  );

  return (
    <nav className="tabbar" aria-label="Main">
      {LEFT.map(item)}
      <button className="fab-wrap" onClick={onLog} aria-label={t("tab.log")}>
        <span className="fab">
          <Plus />
        </span>
        {t("tab.log")}
      </button>
      {RIGHT.map(item)}
    </nav>
  );
}
