import { useEffect, useMemo, useState } from "react";
import type { User } from "../api/auth";
import type { Measurement } from "../types/measurements";
import * as measurementsApi from "../api/measurements";
import { WeightTrend } from "../components/WeightTrend";
import { round1 } from "../lib/format";
import { useT } from "../lib/langHooks";
import type { Translate } from "../lib/i18n";

// Progress tab: current weight, trend chart, and the recent weigh-in history.
// Only rows that actually carry a weight take part in the trend — the
// measurements table is append-only and a row may hold tape measurements only.

function fmtWhen(iso: string, t: Translate): string {
  const d = new Date(iso + "T00:00:00");
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) return t("common.today");
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function Progress({ user }: { user: User }) {
  const t = useT();
  const [items, setItems] = useState<Measurement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    measurementsApi
      .getMeasurements()
      .then(setItems)
      .catch(() => setError(t("progress.loadFailed")));
    // Loaded once on mount; the language only affects the message text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Newest first for the list; oldest first for the chart.
  const weighed = useMemo(
    () => (items ?? []).filter((m) => m.weight_kg !== null),
    [items],
  );
  const newestFirst = useMemo(
    () => [...weighed].sort((a, b) => b.date.localeCompare(a.date)),
    [weighed],
  );

  const current = newestFirst[0]?.weight_kg ?? null;
  const first = newestFirst[newestFirst.length - 1]?.weight_kg ?? null;
  const sinceStart = current !== null && first !== null ? current - first : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(weight.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setError(t("progress.enterWeight"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await measurementsApi.createMeasurement({ weight_kg: value });
      setItems((prev) => [...(prev ?? []), created]);
      setWeight("");
      setNote("");
      setLogging(false);
    } catch {
      setError(t("progress.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (items === null && !error) return <div className="splash">{t("common.loading")}</div>;

  return (
    <div className="pad">
      <header className="screen-head">
        <h1>{t("progress.title")}</h1>
        <p className="sub">{user.username}</p>
      </header>

      {error && <p className="err">{error}</p>}

      <section className="card">
        {current === null ? (
          <p className="empty">{t("progress.noWeighIns")}</p>
        ) : (
          <>
            <div className="stat-hero">
              <span className="stat-hero-value">{round1(current)}</span>
              <span className="stat-hero-unit">kg</span>
            </div>
            {sinceStart !== null && newestFirst.length > 1 && (
              <div className="chip-row">
                <span className={`chip ${sinceStart <= 0 ? "chip-good" : "chip-warn"}`}>
                  {sinceStart > 0 ? "+" : "−"}
                  {round1(Math.abs(sinceStart))} kg
                </span>
                <span className="muted">{t("progress.sinceStart")}</span>
              </div>
            )}
          </>
        )}

        {weighed.length > 1 && <WeightTrend measurements={weighed} />}

        {logging ? (
          <form className="inline-form" onSubmit={submit}>
            <label>
              <span>{t("progress.weight")}</span>
              <input
                autoFocus
                inputMode="decimal"
                placeholder="68.4"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <span className="unit">kg</span>
            </label>
            <label>
              <span>{t("progress.note")}</span>
              <input
                placeholder={t("progress.optional")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <div className="inline-form-actions">
              <button type="button" className="btn-ghost" onClick={() => setLogging(false)}>
                {t("common.cancel")}
              </button>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </form>
        ) : (
          <button className="btn-primary btn-block" onClick={() => setLogging(true)}>
            + {t("progress.logWeight")}
          </button>
        )}
      </section>

      {newestFirst.length > 0 && (
        <>
          <h2 className="section-title">{t("progress.recent")}</h2>
          <ul className="list">
            {newestFirst.slice(0, 8).map((m, i) => {
              const prev = newestFirst[i + 1]?.weight_kg ?? null;
              const delta = prev !== null && m.weight_kg !== null ? m.weight_kg - prev : null;
              return (
                <li key={m.id} className="list-row">
                  <div>
                    <strong>{round1(m.weight_kg!)} kg</strong>
                    <span className="muted"> · {fmtWhen(m.date, t)}</span>
                  </div>
                  {delta !== null && delta !== 0 && (
                    <span className={`chip ${delta <= 0 ? "chip-good" : "chip-warn"}`}>
                      {delta > 0 ? "+" : "−"}
                      {round1(Math.abs(delta))} kg
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
