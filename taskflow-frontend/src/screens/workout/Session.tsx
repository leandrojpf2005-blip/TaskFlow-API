import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Check,
  ChevronDown,
  Clock,
  Dumbbell,
  Layers,
  Minus,
  Pause,
  Play,
  Plus,
  Timer,
  Trash2,
  Weight,
} from "lucide-react";
import { getLastPerformance } from "../../api/workouts";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { usePrefs } from "../../lib/prefs";
import { useFmt } from "../../lib/useFmt";
import { useSession, useTick, type SExercise } from "../../lib/session";
import { parseNum } from "../../lib/locale";
import { kgTo, toKg } from "../../lib/units";
import { Chip, ErrorBanner, ITile, MenuButton, PBar, StatTile, errText, useConfirm } from "../../components/ui";
import { ExercisePicker } from "./ExercisePicker";
import type { LastPerformanceMap } from "../../types/workouts";

const REST_CHOICES = [60, 90, 120, 180];

const clock = (secs: number) => {
  const s = Math.max(0, Math.floor(secs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${ss}` : `${String(m).padStart(2, "0")}:${ss}`;
};

/** "Treino ativo" — the live session. Minimising keeps it running. */
export function Session() {
  const { t } = useLang();
  const f = useFmt();
  const nav = useNav();
  const { bump, toast } = useApp();
  const { prefs, setPrefs } = usePrefs();
  const s = useSession();
  const session = s.session;
  const now = useTick(!!session);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPerf, setLastPerf] = useState<LastPerformanceMap>({});
  const fetched = useRef(new Set<number>());
  const [confirmNode, ask] = useConfirm();

  // Fetch what was lifted last time for any exercise we haven't asked about
  // yet, then seed the untouched sets with it.
  const ids = session?.exercises.map((e) => e.exerciseId).join(",") ?? "";
  useEffect(() => {
    if (!session) return;
    const missing = [...new Set(session.exercises.map((e) => e.exerciseId))].filter((id) => !fetched.current.has(id));
    if (missing.length === 0) return;
    missing.forEach((id) => fetched.current.add(id));
    getLastPerformance(missing)
      .then((map) => {
        setLastPerf((prev) => ({ ...prev, ...map }));
        s.prefill(map);
      })
      .catch(() => {
        /* history is a nicety; the session works without it */
      });
    // Only the set of exercise ids matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  if (!session) {
    return (
      <div className="page bare">
        <p className="splash">{t("session.none")}</p>
      </div>
    );
  }

  const elapsed = (now - session.startedAt) / 1000;
  const allSets = session.exercises.flatMap((e) => e.sets);
  const doneSets = allSets.filter((x) => x.done);
  const volumeKg = doneSets.reduce((a, x) => a + x.reps * x.weight, 0);
  const planned = session.exercises.map((e) => e.sets.length);
  const uniform = planned.length > 0 && planned.every((n) => n === planned[0]);
  const resting = session.restEndsAt !== null && session.restEndsAt > now;
  const restLeft = resting ? (session.restEndsAt! - now) / 1000 : 0;

  const finish = async () => {
    if (doneSets.length === 0) return setError(t("session.needOneSet"));
    setSaving(true);
    setError(null);
    try {
      await s.finish();
      bump("workouts");
      toast(t("session.saved"));
      nav.goTab("workouts");
    } catch (e) {
      setError(errText(e, t));
      setSaving(false);
    }
  };

  const discard = async () => {
    const ok = await ask({
      title: t("session.discard"),
      text: t("session.confirmDiscard"),
      confirm: t("session.discard"),
      cancel: t("common.cancel"),
      danger: true,
    });
    if (!ok) return;
    s.discard();
    nav.pop();
  };

  return (
    <div className="page bare">
      <div className="session-bar">
        <button className="round-btn" onClick={nav.pop} aria-label={t("session.minimize")}>
          <ChevronDown />
        </button>
        <span className="center">{t("session.header")}</span>
        <span className="timer-pill" aria-label={t("session.duration")}>
          <i className="rec-dot" />
          {clock(elapsed)}
        </span>
      </div>

      <div className="session-title">
        <input
          value={session.name}
          onChange={(e) => s.rename(e.target.value)}
          aria-label={t("session.name")}
          size={Math.max(4, session.name.length)}
        />
        <Chip tone="green" icon={Activity} size="lg">
          {t("session.inProgress")}
        </Chip>
      </div>
      <p className="session-sub">
        {uniform && planned[0] > 0
          ? t("session.summaryEach", { n: session.exercises.length, s: planned[0] })
          : t("session.summary", { n: session.exercises.length, s: allSets.length })}
      </p>
      <PBar value={doneSets.length} max={allSets.length} thin />
      <p className="session-progress-label">
        {t("session.completed", { done: doneSets.length, total: allSets.length })}
      </p>

      <ErrorBanner message={error} onClose={() => setError(null)} />

      {session.exercises.map((ex) => (
        <ExerciseCard
          key={ex.uid}
          ex={ex}
          last={lastPerf[String(ex.exerciseId)]}
          onRemove={async () => {
            const ok = await ask({
              title: t("session.removeExercise"),
              text: ex.name,
              confirm: t("session.removeExercise"),
              cancel: t("common.cancel"),
              danger: true,
            });
            if (ok) s.removeExercise(ex.uid);
          }}
        />
      ))}

      {session.exercises.length === 0 && <p className="empty-state muted">{t("session.empty")}</p>}

      <button className="btn btn-dashed card-size" style={{ marginTop: 12 }} onClick={() => setPicking(true)}>
        <Plus />
        {t("session.addExercise")}
      </button>

      <section className={`card rest-card${resting ? " running" : ""}`} style={{ marginTop: 12 }}>
        <ITile icon={Timer} tone="beige" />
        <div className="grow">
          {resting ? (
            <>
              <small>{t("session.rest")}</small>
              <b className="rest-countdown">{clock(restLeft)}</b>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  const i = REST_CHOICES.indexOf(prefs.restSeconds);
                  setPrefs({ restSeconds: REST_CHOICES[(i + 1) % REST_CHOICES.length] });
                }}
                aria-label={t("session.restChange")}
                style={{ textAlign: "left" }}
              >
                <b>
                  {t("session.rest")} · {clock(prefs.restSeconds)}
                </b>
              </button>
              <small>{t("session.restHint")}</small>
            </>
          )}
        </div>
        {resting && (
          <>
            <button className="adj" onClick={() => s.adjustRest(-15)} aria-label="−15s">
              −15
            </button>
            <button className="adj" onClick={() => s.adjustRest(15)} aria-label="+15s">
              +15
            </button>
          </>
        )}
        <button
          className="play"
          onClick={() => (resting ? s.stopRest() : s.startRest(prefs.restSeconds))}
          aria-label={resting ? t("session.restStop") : t("session.restStart")}
        >
          {resting ? <Pause /> : <Play />}
        </button>
      </section>

      <section className="card">
        <span className="card-title">{t("session.summaryTitle")}</span>
        <div className="stat-tiles" style={{ marginTop: 12 }}>
          <StatTile icon={Clock} value={f.num(Math.floor(elapsed / 60))} unit="min" label={t("session.duration")} />
          <StatTile icon={Weight} value={f.num(kgTo(volumeKg, f.wUnit))} unit={f.wUnit} label={t("session.volume")} />
          <StatTile icon={Layers} value={doneSets.length} label={t("session.setsLabel")} />
        </div>
      </section>

      <div className="sticky-cta">
        <button className="btn btn-primary" onClick={finish} disabled={saving}>
          {saving ? t("common.saving") : t("session.finish")}
        </button>
        <button className="btn btn-text" onClick={discard} disabled={saving}>
          {t("session.discard")}
        </button>
      </div>

      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={(ex) => {
            s.addExercise({ exerciseId: ex.id, name: ex.name, image: ex.images?.[0] ?? null });
            setPicking(false);
          }}
        />
      )}
      {confirmNode}
    </div>
  );
}

function ExerciseCard({
  ex,
  last,
  onRemove,
}: {
  ex: SExercise;
  last?: LastPerformanceMap[string];
  onRemove: () => void;
}) {
  const { t } = useLang();
  const f = useFmt();
  const { prefs } = usePrefs();
  const s = useSession();
  const firstReps = ex.sets[0]?.reps ?? 0;
  const sameReps = ex.sets.every((x) => x.reps === firstReps);

  return (
    <section className="card ex-card">
      <div className="ex-head">
        {ex.image ? <img className="ex-thumb" src={ex.image} alt="" loading="lazy" /> : <ITile icon={Dumbbell} size="lg" />}
        <div className="grow">
          <b>{ex.name}</b>
          <small>
            {sameReps
              ? t("session.plan", { s: ex.sets.length, r: firstReps })
              : t("workout.setsCount", { n: ex.sets.length })}
          </small>
        </div>
        <MenuButton
          label={t("session.exerciseMenu")}
          items={[
            { label: t("session.removeSet"), icon: Minus, onClick: () => s.removeSet(ex.uid) },
            { label: t("session.removeExercise"), icon: Trash2, onClick: onRemove, danger: true },
          ]}
        />
      </div>

      {last && (
        <p className="ex-last">
          {t("session.lastTime", {
            sets: last.sets.map((x) => `${f.weight(Number(x.weight))} ${f.wUnit} × ${x.reps}`).join(" · "),
          })}
        </p>
      )}

      <div className="set-grid head">
        <span>{t("session.set")}</span>
        <span>{t("session.weight")}</span>
        <span>{t("session.reps")}</span>
        <span />
      </div>
      {ex.sets.map((st, i) => (
        <div className={`set-grid set-row${st.done ? " done" : ""}`} key={i}>
          <span className="set-num">{i + 1}</span>
          <NumberCell
            value={kgTo(st.weight, prefs.weightUnit)}
            unit={prefs.weightUnit}
            decimals={2}
            label={`${t("session.weight")} ${i + 1}`}
            onCommit={(v) => s.updateSet(ex.uid, i, { weight: toKg(v, prefs.weightUnit), touched: true })}
            fmt={(v) => f.num(v, 2)}
          />
          <NumberCell
            value={st.reps}
            decimals={0}
            label={`${t("session.reps")} ${i + 1}`}
            onCommit={(v) => s.updateSet(ex.uid, i, { reps: Math.round(v), touched: true })}
            fmt={(v) => String(Math.round(v))}
          />
          <button
            className="set-check"
            onClick={() => s.toggleSet(ex.uid, i, prefs.restSeconds)}
            aria-label={st.done ? t("session.uncheck") : t("session.check")}
            aria-pressed={st.done}
          >
            <Check />
          </button>
        </div>
      ))}

      <button className="btn btn-dashed" onClick={() => s.addSet(ex.uid)}>
        <Plus />
        {t("session.addSet")}
      </button>
    </section>
  );
}

/**
 * Numeric cell that keeps the raw text while focused (so "32," can be typed)
 * and commits a parsed number on every valid keystroke.
 */
function NumberCell({
  value,
  unit,
  decimals,
  label,
  onCommit,
  fmt,
}: {
  value: number;
  unit?: string;
  decimals: number;
  label: string;
  onCommit: (v: number) => void;
  fmt: (v: number) => string;
}) {
  const [raw, setRaw] = useState<string | null>(null);
  const shown = raw ?? fmt(Math.round(value * 10 ** decimals) / 10 ** decimals);
  return (
    <label className={`set-in${unit ? "" : " no-unit"}`}>
      <span className="sr-only">{label}</span>
      <input
        className="tnum"
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        value={shown}
        onFocus={(e) => {
          setRaw(shown);
          e.target.select();
        }}
        onChange={(e) => {
          setRaw(e.target.value);
          const v = parseNum(e.target.value);
          if (Number.isFinite(v) && v >= 0) onCommit(v);
        }}
        onBlur={() => setRaw(null)}
      />
      {unit && <span className="u">{unit}</span>}
    </label>
  );
}
