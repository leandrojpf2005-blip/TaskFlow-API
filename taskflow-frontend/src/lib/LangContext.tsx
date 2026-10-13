import { useMemo, useState, type ReactNode } from "react";
import { getSavedLang, saveLang, translator, type Lang } from "./i18n";
import { LangCtx, type LangValue } from "./langHooks";

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getSavedLang);

  const value = useMemo<LangValue>(
    () => ({
      lang,
      setLang: (l) => {
        saveLang(l);
        setLangState(l);
      },
      t: translator(lang),
    }),
    [lang],
  );

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}
