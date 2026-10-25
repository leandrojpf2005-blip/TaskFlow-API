/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

// A small screen stack on top of the four tabs. Pushed screens stay mounted
// underneath the top one (hidden), so going back keeps search terms, scroll
// position and half-filled forms exactly as they were.

export type Chrome = "tabs" | "full";
export type Tab = "workouts" | "home" | "progress" | "more";

export interface NavEntry {
  id: number;
  node: ReactNode;
  /** "tabs" keeps the bottom bar visible (the Log flow); "full" hides it. */
  chrome: Chrome;
}

interface NavValue {
  tab: Tab;
  /** Switch tab and close anything stacked on top. */
  goTab: (t: Tab) => void;
  stack: NavEntry[];
  push: (node: ReactNode, chrome?: Chrome) => void;
  replace: (node: ReactNode, chrome?: Chrome) => void;
  pop: () => void;
  popToRoot: () => void;
}

const Ctx = createContext<NavValue | null>(null);

let nextId = 1;

export function NavProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<Tab>("home");
  const [stack, setStack] = useState<NavEntry[]>([]);
  // Scroll offset of each layer, restored when the layer above it closes.
  const scrolls = useRef<number[]>([]);
  const pendingScroll = useRef<number | null>(null);

  const push = useCallback((node: ReactNode, chrome: Chrome = "full") => {
    scrolls.current.push(window.scrollY);
    pendingScroll.current = 0;
    setStack((s) => [...s, { id: nextId++, node, chrome }]);
  }, []);

  const replace = useCallback((node: ReactNode, chrome: Chrome = "full") => {
    pendingScroll.current = 0;
    setStack((s) => [...s.slice(0, -1), { id: nextId++, node, chrome }]);
  }, []);

  const pop = useCallback(() => {
    pendingScroll.current = scrolls.current.pop() ?? 0;
    setStack((s) => s.slice(0, -1));
  }, []);

  const popToRoot = useCallback(() => {
    pendingScroll.current = scrolls.current[0] ?? 0;
    scrolls.current = [];
    setStack([]);
  }, []);

  const goTab = useCallback((t: Tab) => {
    scrolls.current = [];
    pendingScroll.current = 0;
    setStack([]);
    setTab(t);
  }, []);

  useLayoutEffect(() => {
    if (pendingScroll.current !== null) {
      window.scrollTo(0, pendingScroll.current);
      pendingScroll.current = null;
    }
  }, [stack, tab]);

  const value = useMemo(
    () => ({ tab, goTab, stack, push, replace, pop, popToRoot }),
    [tab, goTab, stack, push, replace, pop, popToRoot],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNav(): NavValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNav must be used inside <NavProvider>");
  return v;
}
