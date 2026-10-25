import { createContext, useContext } from "react";
import type { Lang, Translate } from "./i18n";

// The context object and its hooks live apart from the provider component so
// that the provider file only exports components (keeps Fast Refresh working).

export interface LangValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translate;
}

export const LangCtx = createContext<LangValue | null>(null);

export function useLang(): LangValue {
  const v = useContext(LangCtx);
  if (!v) throw new Error("useLang must be used inside <LangProvider>");
  return v;
}

/** Shorthand for components that only need the translate function. */
export function useT(): Translate {
  return useLang().t;
}
