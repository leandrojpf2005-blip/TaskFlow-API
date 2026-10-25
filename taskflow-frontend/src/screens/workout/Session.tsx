import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowLeftRight,
  Check,
  ChevronDown,
  Clock,
  GripVertical,
  Layers,
  Minus,
  Pause,
  Play,
  Plus,
  Timer,
  Trash2,
  Weight,
} from "lucide-react";
import { getLastPerformance, routineEditMissing, updateRoutine } from "../../api/workouts";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { usePrefs } from "../../lib/prefs";
import { useFmt } from "../../lib/useFmt";
import { useSession, useTick, type SExercise } from "../../lib/session";
import { parseNum } from "../../lib/locale";
import { useExercises } from "../../lib/exercises";
import { ExerciseArt } from "../../components/ExerciseArt";
import { kgTo, toKg } from "../../lib/units";
import { Chip, ErrorBanner, ITile, MenuButton, PBar, Sheet, StatTile, errText, useConfirm } from "../../components/ui";
import { SortableList } from "../../components/Sortable";
import { SwipeRow } from "../../components/Swipe";
import { ExercisePicker } from "./ExercisePicker";
import { routineChanges } from "./start";
import type { Exercise, LastPerformanceMap } from "../../types/workouts";

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
  const exs = useExercises();
  const session = s.session;
  const now = useTick(!!session);
  const [picking, setPicking] = useState(false);
  const [replacing, setReplacing] = useState<string | null>(null); // uid of the exercise being swapped
  const [reordering, setReordering] = useState(false);
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
    // Started from a routine and changed along the way (swapped, added or
    // removed exercises, different set counts)? Offer to keep the changes.
    const changes = await routineChanges(session).catch(() => null);
    const update =
      changes !== null &&
      (await ask({
        title: t("session.updateRoutineTitle", { name: changes.routine.name }),
        text: t("session.updateRoutineText"),
        confirm: t("session.updateRoutine"),
        cancel: t("session.keepRoutine"),
      }));
    try {
      await s.finish();
    } catch (e) {
      setError(errText(e, t));
      setSaving(false);
      return;
    }
    bump("workouts");
    if (update && changes) {
      try {
        await updateRoutine(changes.routine.id, changes.body);
        bump("routines");
        toast(t("routine.updated"));
      } catch (e) {
        // The workout is saved either way; only the routine stayed as it was.
        toast(routineEditMissing(e) ? t("routine.editUnavailable") : errText(e, t));
      }
    } else {
      toast(t("session.saved"));
    }
    nav.goTab("workouts");
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
          name={exs.name(ex.exerciseId, ex.name)}
          info={exs.get(ex.exerciseId)}
          last={lastPerf[String(ex.exerciseId)]}
          onReplace={() => setReplacing(ex.uid)}
          onReorder={() => setReordering(true)}
          onRemove={async () => {
            const ok = await ask({
              title: t("session.removeExercise"),
              text: exs.name(ex.exerciseId, ex.name),
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
            s.addExercise({ exerciseId: ex.id, name: ex.name });
            setPicking(false);
          }}
        />
      )}
      {reordering && (
        <Sheet onClose={() => setReordering(false)} title={t("session.reorder")} subtitle={t("session.reorderHint")}>
          <SortableList items={session.exercises} idOf={(e) => e.uid} onMove={s.moveExercise} holdMs={140} className="reorder">
            {(ex, handle) => (
              <div className="reorder-row" ref={handle.ref} {...handle.props}>
                <ExerciseArt ex={exs.get(ex.exerciseId)} />
                <b>{exs.name(ex.exerciseId, ex.name)}</b>
                <GripVertical />
              </div>
            )}
          </SortableList>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setReordering(false)}>
            {t("common.done")}
          </button>
        </Sheet>
      )}
      {replacing && (
        <ExercisePicker
          title={t("session.replaceExercise")}
          initialPart={exs.get(session.exercises.find((e) => e.uid === replacing)?.exerciseId ?? -1)?.body_part}
          onClose={() => setReplacing(null)}
          onPick={(ex) => {
            s.replaceExercise(replacing, { exerciseId: ex.id, name: ex.name });
            // Already looked up this session? Fill the moved sets from it now;
            // otherwise the last-performance effect does it when it arrives.
            const known = lastPerf[String(ex.id)];
            if (known) s.prefill({ [String(ex.id)]: known });
            setReplacing(null);
          }}
        />
      )}
      {confirmNode}
    </div>
  );
}

function ExerciseCard({
  ex,
  name,
  info,
  last,
  onReplace,
  onReorder,
  onRemove,
}: {
  ex: SExercise;
  name: string;
  info?: Exercise;
  last?: LastPerformanceMap[string];
  onReplace: () => void;
  onReorder: () => void;
  onRemove: () => void;
}) {
  const { t } = useLang();
  const f = useFmt();
  const { prefs } = usePrefs();
  const s = useSession();
  // Holding the exercise (picture or name) opens the reorder list, like Strong.
  const hold = useRef<{ timer: number; x: number; y: number } | null>(null);
  const held = useRef(false); // the hold fired: swallow the tap the finger makes when it lifts
  const cancelHold = () => {
    if (hold.current) window.clearTimeout(hold.current.timer);
    hold.current = null;
  };
  const firstReps = ex.sets[0]?.reps ?? 0;
  const sameReps = ex.sets.every((x) => x.reps === firstReps);

  return (
    <section className="card ex-card">
      <div
        className="ex-head hold"
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" || (e.target as HTMLElement).closest("button")) return;
          held.current = false;
          const timer = window.setTimeout(() => {
            held.current = true;
            navigator.vibrate?.(12);
            onReorder();
          }, 450);
          hold.current = { timer, x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          if (hold.current && Math.hypot(e.clientX - hold.current.x, e.clientY - hold.current.y) > 8) cancelHold();
        }}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onTouchEnd={(e) => {
          // Otherwise the lift lands as a click on the sheet's backdrop and closes it.
          if (held.current) e.preventDefault();
          held.current = false;
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <ExerciseArt ex={info} size="lg" />
        <div className="grow">
          <b>{name}</b>
          <small>
            {sameReps
              ? t("session.plan", { s: ex.sets.length, r: firstReps })
              : t("workout.setsCount", { n: ex.sets.length })}
          </small>
        </div>
        <MenuButton
          label={t("session.exerciseMenu")}
          items={[
            { label: t("session.replaceExercise"), icon: ArrowLeftRight, onClick: onReplace },
            { label: t("session.reorder"), icon: GripVertical, onClick: onReorder },
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
        <SwipeRow
          key={i}
          className="set"
          label={t("common.delete")}
          onSwipe={() => {
            if (ex.sets.length < 2) return false; // an exercise keeps at least one set
            s.removeSetAt(ex.uid, i);
            return true;
          }}
        >
          <div className={`set-grid set-row${st.done ? " done" : ""}`}>
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
        </SwipeRow>
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
