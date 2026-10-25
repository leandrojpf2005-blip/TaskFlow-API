import { useMemo } from "react";
import { useLang } from "./langHooks";
import { usePrefs } from "./prefs";
import { cap, editable, fmtDate, fmtNum, fmtSigned } from "./locale";
import { cmTo, kgTo } from "./units";

/** Formatters bound to the current language and unit preferences. */
export function useFmt() {
  const { lang } = useLang();
  const { prefs } = usePrefs();

  return useMemo(() => {
    const num = (n: number, frac = 0) => fmtNum(lang, n, frac);
    return {
      lang,
      num,
      signed: (n: number, frac = 1) => fmtSigned(lang, n, frac),
      kcal: (n: number) => fmtNum(lang, Math.round(n)),
      /** Macro grams: one decimal below 10 g ("1,3"), whole above ("27"). */
      g: (n: number) => fmtNum(lang, n, Math.abs(n) < 10 ? 1 : 0),
      wUnit: prefs.weightUnit,
      lUnit: prefs.lengthUnit,
      /** Body or lifted weight, converted from kg into the preferred unit. */
      weight: (kg: number, frac = 1) => fmtNum(lang, kgTo(kg, prefs.weightUnit), frac),
      /** Body weight, always one decimal like the mockups ("72,0", "68,4"). */
      bw: (kg: number) => fmtNum(lang, kgTo(kg, prefs.weightUnit), 1, 1),
      editable: (n: number, frac = 1) => editable(lang, n, frac),
      weightSigned: (kg: number, frac = 1) => fmtSigned(lang, kgTo(kg, prefs.weightUnit), frac),
      length: (cm: number) => fmtNum(lang, cmTo(cm, prefs.lengthUnit), 1),
      lengthSigned: (cm: number) => fmtSigned(lang, cmTo(cm, prefs.lengthUnit), 1),
      date: (d: Date, opts: Intl.DateTimeFormatOptions) => cap(fmtDate(lang, d, opts)),
      /** "13 Oct" / "13 out" — pt-PT's Intl short month is numeric ("13/10"), so build it. */
      dayMonth: (d: Date, withYear = false) => {
        const month = fmtDate(lang, d, { month: "short" }).replace(".", "");
        const body =
          lang === "en" ? `${cap(month)} ${d.getDate()}` : lang === "pt" ? `${d.getDate()} ${month}` : fmtDate(lang, d, { day: "numeric", month: "short" });
        return withYear ? `${body} ${d.getFullYear()}` : body;
      },
      /** "Tue" / "Ter" / "Mar". */
      weekdayShort: (d: Date) => {
        const w = fmtDate(lang, d, { weekday: "short" }).replace(".", "");
        return cap(lang === "pt" ? w.slice(0, 3) : w);
      },
    };
  }, [lang, prefs.weightUnit, prefs.lengthUnit]);
}

export type Fmt = ReturnType<typeof useFmt>;
