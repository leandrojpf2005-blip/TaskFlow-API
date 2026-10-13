import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import * as measurementsApi from "../../api/measurements";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { usePrefs } from "../../lib/prefs";
import { useFmt } from "../../lib/useFmt";
import { parseNum } from "../../lib/locale";
import { toCm } from "../../lib/units";
import { parseDay, todayIso } from "../../lib/dates";
import { ErrorBanner, ITile, ScreenHeader, errText } from "../../components/ui";
import type { NewMeasurement } from "../../types/measurements";

const FIELDS = [
  { key: "chest_cm", label: "progress.measure.chest" },
  { key: "waist_cm", label: "progress.measure.waist" },
  { key: "arm_cm", label: "progress.measure.arm" },
  { key: "thigh_cm", label: "progress.measure.thigh" },
] as const;

type Key = (typeof FIELDS)[number]["key"];

/** Tape measurements — fill in only what you measured. */
export function LogMeasures() {
  const { t } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { bump, toast } = useApp();
  const { prefs } = usePrefs();
  const [date, setDate] = useState(todayIso);
  const [vals, setVals] = useState<Record<Key, string>>({ chest_cm: "", waist_cm: "", arm_cm: "", thigh_cm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const body: NewMeasurement = { date };
    let any = false;
    for (const fl of FIELDS) {
      const v = parseNum(vals[fl.key]);
      if (Number.isFinite(v) && v > 0) {
        body[fl.key] = Math.round(toCm(v, prefs.lengthUnit) * 10) / 10;
        any = true;
      }
    }
    if (!any) return setError(t("measures.needOne"));
    setBusy(true);
    setError(null);
    try {
      await measurementsApi.createMeasurement(body);
      bump("measurements");
      toast(t("measures.saved"));
      nav.pop();
    } catch (e) {
      setError(errText(e, t));
      setBusy(false);
    }
  };

  return (
    <div className="page bare">
      <ScreenHeader title={t("measures.title")} subtitle={t("measures.subtitle")} onBack={nav.pop} backLabel={t("common.back")} />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      <label className="card select-card">
        <ITile icon={CalendarDays} />
        <span className="grow">
          <b>{f.date(parseDay(date), { day: "numeric", month: "long", year: "numeric" })}</b>
          <small>{t("weight.tapDate")}</small>
        </span>
        <ChevronDown />
        <input
          type="date"
          value={date}
          max={todayIso()}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }}
          aria-label={t("weight.date")}
        />
      </label>

      <section className="card" style={{ marginTop: 12 }}>
        <div className="input-grid">
          {FIELDS.map((fl) => (
            <label className="field" key={fl.key} style={{ marginTop: 0 }}>
              <span>{t(fl.label)}</span>
              <div className="input-wrap">
                <input
                  className="input"
                  inputMode="decimal"
                  value={vals[fl.key]}
                  onChange={(e) => setVals((v) => ({ ...v, [fl.key]: e.target.value }))}
                  placeholder="—"
                />
                <span className="unit">{prefs.lengthUnit}</span>
              </div>
            </label>
          ))}
        </div>
      </section>

      <div className="sticky-cta">
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? t("common.saving") : t("measures.save")}
        </button>
        <button className="btn btn-text" onClick={nav.pop}>
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
