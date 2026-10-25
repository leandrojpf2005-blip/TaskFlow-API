import type { Lang } from "./i18n";

// Number and date formatting per UI language, so Portuguese shows "68,4" and
// "3 240" while English shows "68.4" and "3,240".

const LOCALES: Record<Lang, string> = {
  en: "en-US",
  pt: "pt-PT",
  es: "es-ES",
  fr: "fr-FR",
};

export const localeOf = (lang: Lang) => LOCALES[lang];

const numCache = new Map<string, Intl.NumberFormat>();

function numberFormat(lang: Lang, maxFrac: number, minFrac: number): Intl.NumberFormat {
  const key = `${lang}|${maxFrac}|${minFrac}`;
  let f = numCache.get(key);
  if (!f) {
    const opts: Intl.NumberFormatOptions = {
      maximumFractionDigits: maxFrac,
      minimumFractionDigits: minFrac,
    };
    // "always" groups 4-digit numbers too (pt-PT would otherwise print 3240).
    try {
      f = new Intl.NumberFormat(LOCALES[lang], { ...opts, useGrouping: "always" });
    } catch {
      f = new Intl.NumberFormat(LOCALES[lang], opts);
    }
    numCache.set(key, f);
  }
  return f;
}

/** Format a number for display; `maxFrac` decimals at most, trailing zeros dropped. */
export function fmtNum(lang: Lang, n: number, maxFrac = 0, minFrac = 0): string {
  if (!Number.isFinite(n)) return "—";
  return numberFormat(lang, maxFrac, minFrac).format(n);
}

/** Signed number with a real minus sign, e.g. "−1,6" / "+0,4". */
export function fmtSigned(lang: Lang, n: number, maxFrac = 1): string {
  const body = fmtNum(lang, Math.abs(n), maxFrac);
  if (Math.abs(n) < 10 ** -maxFrac / 2) return body;
  return `${n < 0 ? "−" : "+"}${body}`;
}

/** The decimal mark users expect to type: "," everywhere but English. */
export const decimalSep = (lang: Lang) => (lang === "en" ? "." : ",");

/** A number as an editable string: at most `frac` decimals, locale decimal mark, no grouping. */
export function editable(lang: Lang, n: number, frac = 1): string {
  const r = Math.round(n * 10 ** frac) / 10 ** frac;
  return String(r).replace(".", decimalSep(lang));
}

/** Parse what a user typed, accepting both "68,4" and "68.4". */
export function parseNum(raw: string): number {
  const cleaned = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (cleaned === "") return NaN;
  return Number(cleaned);
}

export function fmtDate(lang: Lang, d: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(LOCALES[lang], opts).format(d);
}

/** Capitalise the first letter — pt/es/fr weekday and month names come lowercase. */
export function cap(s: string): string {
  return s.charAt(0).toLocaleUpperCase() + s.slice(1);
}
