import { useState, type ReactNode } from "react";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { useSession, type SessionInit } from "../../lib/session";
import { errText, useConfirm } from "../../components/ui";
import { Session } from "./Session";

/**
 * Start a session from some async source (a routine, a past workout, or
 * nothing). If one is already running, ask before replacing it.
 */
export function useStarter(): {
  start: (make: () => Promise<SessionInit> | SessionInit) => Promise<void>;
  resume: () => void;
  starting: boolean;
  error: string | null;
  clearError: () => void;
  confirmNode: ReactNode;
} {
  const { t } = useLang();
  const nav = useNav();
  const s = useSession();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmNode, ask] = useConfirm();

  const start = async (make: () => Promise<SessionInit> | SessionInit) => {
    if (s.session) {
      const replace = await ask({
        title: t("workout.replaceTitle"),
        text: t("workout.replaceText", { name: s.session.name }),
        confirm: t("workout.replaceConfirm"),
        cancel: t("workout.resume"),
        danger: true,
      });
      if (!replace) {
        nav.push(<Session />);
        return;
      }
    }
    setStarting(true);
    setError(null);
    try {
      s.start(await make());
      nav.push(<Session />);
    } catch (e) {
      setError(errText(e, t));
    } finally {
      setStarting(false);
    }
  };

  return {
    start,
    resume: () => nav.push(<Session />),
    starting,
    error,
    clearError: () => setError(null),
    confirmNode,
  };
}
