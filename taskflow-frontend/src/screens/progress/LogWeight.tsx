import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, ChevronDown, Pencil, Scale, TrendingDown, TrendingUp } from "lucide-react";
import * as measurementsApi from "../../api/measurements";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { usePrefs } from "../../lib/prefs";
import { useFmt } from "../../lib/useFmt";
import { parseNum } from "../../lib/locale";
import { kgTo, toKg, type WeightUnit } from "../../lib/units";
import { parseDay, todayIso } from "../../lib/dates";
import { Chip, ErrorBanner, ITile, ScreenHeader, Stepper, errText } from "../../components/ui";
import type { Measurement } from "../../types/measurements";

/** "Registar peso" — one weigh-in, with date, unit and an optional note. */
export function LogWeight() {
  const { t } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { profile, bump, toast } = useApp();
  const { prefs, setPrefs } = usePrefs();
  const unit = prefs.weightUnit;
  const [date, setDate] = useState(todayIso);
  const [raw, setRaw] = useState(() => f.editable(kgTo(Number(profile.weight_kg), unit)));
  const [note, setNote] = useState("");
  const [last, setLast] = useState<Measurement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start from the latest weigh-in rather than the profile weight when there is one.
  useEffect(() => {
    measurementsApi
      .getMeasurements()
      .then((ms) => {
        const lastW = [...ms]
          .filter((m) => m.weight_kg !== null)
          .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
          .pop();
        if (lastW) {
          setLast(lastW);
          setRaw(f.editable(kgTo(Number(lastW.weight_kg), unit)));
        }
      })
      .catch(() => {});
    // unit is read once for the initial value; switching units converts raw below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = parseNum(raw);
  const valid = Number.isFinite(value) && value > 0 && value < 1000;
  const kg = valid ? toKg(value, unit) : NaN;
  const lastKg = last ? Number(last.weight_kg) : null;
  const delta = valid && lastKg !== null ? kg - lastKg : null;
  const wantsLoss = (profile.weekly_change_kg ?? 0) <= 0;

  const bumpBy = (d: number) => setRaw(f.editable(Math.max(0, (valid ? value : 0) + d)));

  const switchUnit = (next: WeightUnit) => {
    if (valid) setRaw(f.editable(kgTo(toKg(value, unit), next)));
    setPrefs({ weightUnit: next });
  };

  const save = async () => {
    if (!valid) return setError(t("progress.enterWeight"));
    setBusy(true);
    setError(null);
    try {
      await measurementsApi.createMeasurement({
        weight_kg: Math.round(kg * 100) / 100,
        date,
        note: note.trim() || null,
      });
      bump("measurements");
      toast(t("weight.saved"));
      nav.pop();
    } catch (e) {
      setError(errText(e, t));
      setBusy(false);
    }
  };

  const d = parseDay(date);
  const dateTitle = `${date === todayIso() ? `${t("common.today")} · ` : ""}${f.date(d, { day: "numeric", month: "long", year: "numeric" })}`;

  return (
    <div className="page bare">
      <ScreenHeader title={t("weight.title")} subtitle={t("weight.subtitle")} onBack={nav.pop} backLabel={t("common.back")} />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      <p className="label-out" style={{ marginTop: 0 }}>
        {t("weight.date")}
      </p>
      <label className="card select-card">
        <ITile icon={CalendarDays} />
        <span className="grow">
          <b>{dateTitle}</b>
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
        <div className="card-row">
          <span className="card-title">{t("weight.current")}</span>
          <select className="select-chip" value={unit} onChange={(e) => switchUnit(e.target.value as WeightUnit)} aria-label={t("units.weight")}>
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </div>
        <Stepper value={raw} onChange={setRaw} onStep={(dir) => bumpBy(dir * 0.1)} unit={unit} label={t("weight.current")} />
        <div className="adj-chips">
          {[-1, -0.1, 0.1, 1].map((x) => (
            <button key={x} onClick={() => bumpBy(x)} className="tnum">
              {f.signed(x, 1)}
            </button>
          ))}
        </div>
        <div className="delta-line">
          {delta === null ? (
            <Chip tone="neutral">{last ? "—" : t("weight.firstEntry")}</Chip>
          ) : Math.abs(delta) < 0.05 ? (
            <Chip tone="neutral">{t("weight.sinceLast", { d: `0 ${unit}` })}</Chip>
          ) : (
            <Chip tone={(wantsLoss ? delta <= 0 : delta >= 0) ? "green" : "coral"} icon={delta <= 0 ? TrendingDown : TrendingUp}>
              <span className="tnum">{t("weight.sinceLast", { d: `${f.weightSigned(delta)} ${unit}` })}</span>
            </Chip>
          )}
        </div>
      </section>

      <p className="label-out">{t("weight.note")}</p>
      <div className="input-wrap">
        <Pencil />
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("weight.notePlaceholder")} maxLength={140} />
      </div>

      {last && lastKg !== null && (
        <div className="card select-card" style={{ marginTop: 12 }}>
          <ITile icon={Scale} tone="beige" />
          <span className="grow">
            <small>{t("weight.lastEntry", { date: f.dayMonth(parseDay(last.date)) })}</small>
            <b className="tnum">
              {f.bw(lastKg)} {unit}
              {valid ? ` → ${f.bw(kg)} ${unit}` : ""}
            </b>
          </span>
          <ArrowRight />
        </div>
      )}

      <div className="sticky-cta">
        <button className="btn btn-primary" onClick={save} disabled={busy || !valid}>
          {busy ? t("common.saving") : t("weight.save")}
        </button>
        <button className="btn btn-text" onClick={nav.pop}>
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}

