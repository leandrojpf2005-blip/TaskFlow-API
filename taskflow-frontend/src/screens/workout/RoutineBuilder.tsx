import { useEffect, useState } from "react";
import { ArrowLeftRight, Dumbbell, Minus, Plus, X } from "lucide-react";
import { createRoutine, getFolders, getRoutineExercises, routineEditMissing, updateRoutine } from "../../api/workouts";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { useExercises } from "../../lib/exercises";
import { ExerciseArt } from "../../components/ExerciseArt";
import { EmptyState, ErrorBanner, ScreenHeader, errText } from "../../components/ui";
import { SortableList } from "../../components/Sortable";
import { ExercisePicker } from "./ExercisePicker";
import type { Folder, Routine } from "../../types/workouts";

interface Item {
  key: string; // stable id for drag-and-drop (the same exercise can appear twice)
  exerciseId: number;
  name: string;
  sets: number;
}

const newKey = () => Math.random().toString(36).slice(2, 10);

/**
 * "Nova rotina" — name it, pick exercises, set how many sets each. Given a
 * routine, the same screen edits it: rename, reorder, add, remove, change sets.
 */
export function RoutineBuilder({ routine, folderId = null }: { routine?: Routine; folderId?: number | null }) {
  const { t } = useLang();
  const nav = useNav();
  const { bump, toast } = useApp();
  const exs = useExercises();
  const [name, setName] = useState(routine?.name ?? "");
  const [folder, setFolder] = useState<number | null>(routine ? (routine.folder_id ?? null) : folderId);
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [loaded, setLoaded] = useState<Item[] | null>(null);
  const [edited, setEdited] = useState<Item[] | null>(null);
  const [picking, setPicking] = useState(false);
  const [swapping, setSwapping] = useState<number | null>(null); // index of the exercise being swapped
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getFolders()
      .then((fs) => live && setFolders(fs))
      .catch(() => undefined); // no folders: the chooser just doesn't show
    return () => {
      live = false;
    };
  }, []);

  // Editing: start from the routine's exercises; any change makes a local copy.
  useEffect(() => {
    if (!routine) return;
    let live = true;
    getRoutineExercises(routine.id)
      .then((list) => live && setLoaded(list.map((e) => ({ key: newKey(), exerciseId: e.exercise_id, name: e.name, sets: e.sets }))))
      .catch((e) => {
        if (!live) return;
        setError(errText(e, t));
        setLoaded([]);
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine?.id]);

  const items = edited ?? loaded ?? [];
  const loading = !!routine && loaded === null && edited === null;
  const setItems = (fn: (prev: Item[]) => Item[]) => setEdited(fn(items));

  const patch = (i: number, p: Partial<Item>) => setItems((prev) => prev.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (from: number, to: number) =>
    setItems((prev) => {
      const next = [...prev];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });

  const save = async () => {
    if (!name.trim()) return setError(t("routine.needName"));
    if (items.length === 0) return setError(t("routine.needExercise"));
    setBusy(true);
    setError(null);
    const body = { name: name.trim(), items: items.map((x) => ({ exercise_id: x.exerciseId, sets: x.sets })), folder_id: folder };
    try {
      if (routine) await updateRoutine(routine.id, body);
      else await createRoutine(body);
      bump("routines");
      toast(t(routine ? "routine.updated" : "routine.saved"));
      nav.pop();
    } catch (e) {
      setError(routineEditMissing(e) ? t("routine.editUnavailable") : errText(e, t));
      setBusy(false);
    }
  };

  return (
    <div className="page bare">
      <ScreenHeader
        title={t(routine ? "routine.editTitle" : "routine.title")}
        subtitle={t(routine ? "routine.editSubtitle" : "routine.subtitle")}
        onBack={nav.pop}
        backLabel={t("common.back")}
      />
      <ErrorBanner message={error} onClose={() => setError(null)} />

      <section className="card">
        <label className="field">
          <span>{t("routine.name")}</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("routine.namePlaceholder")} />
        </label>
        {folders && folders.length > 0 && (
          <div className="field" style={{ marginTop: 14 }}>
            <span>{t("folders.folder")}</span>
            <div className="metric-chips sm" role="radiogroup" aria-label={t("folders.folder")} style={{ marginBottom: 0, flexWrap: "wrap" }}>
              {[null, ...folders].map((f) => (
                <button
                  key={f?.id ?? "none"}
                  className={folder === (f?.id ?? null) ? "on" : ""}
                  onClick={() => setFolder(f?.id ?? null)}
                  role="radio"
                  aria-checked={folder === (f?.id ?? null)}
                >
                  {f?.name ?? t("folders.none")}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="list-head">
        <b>{t("routine.exercises")}</b>
        <span className="muted" style={{ fontSize: 13 }}>
          {t("workout.setsCount", { n: items.reduce((a, x) => a + x.sets, 0) })}
        </span>
      </div>
      {items.length > 1 && <p className="drag-hint">{t("session.reorderHint")}</p>}

      {loading ? (
        <p className="splash">{t("common.loading")}</p>
      ) : items.length === 0 ? (
        <EmptyState icon={Dumbbell} title={t("routine.empty")} text={t("routine.emptyHint")} />
      ) : (
        <SortableList items={items} idOf={(it) => it.key} onMove={move} className="stack">
          {(it, handle) => {
            const i = items.indexOf(it);
            return (
              <section className="card">
                <div className="ex-head" style={{ marginBottom: 12 }}>
                  {/* hold the picture or the name to drag the exercise up or down */}
                  <div className="drag-handle" ref={handle.ref} {...handle.props}>
                    <ExerciseArt ex={exs.get(it.exerciseId)} size="lg" />
                    <b>{exs.name(it.exerciseId, it.name)}</b>
                  </div>
                  <button className="icon-act" onClick={() => setSwapping(i)} aria-label={t("session.replaceExercise")}>
                    <ArrowLeftRight />
                  </button>
                  <button className="icon-del" onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))} aria-label={t("common.delete")}>
                    <X />
                  </button>
                </div>
                <div className="card-row">
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{t("routine.sets")}</span>
                  <div className="card-row" style={{ gap: 12 }}>
                    <button className="round-btn sm" onClick={() => patch(i, { sets: Math.max(1, it.sets - 1) })} aria-label="−">
                      <Minus />
                    </button>
                    <b className="tnum" style={{ fontSize: 18, minWidth: 22, textAlign: "center" }}>
                      {it.sets}
                    </b>
                    <button className="round-btn sm" onClick={() => patch(i, { sets: Math.min(12, it.sets + 1) })} aria-label="+">
                      <Plus />
                    </button>
                  </div>
                </div>
              </section>
            );
          }}
        </SortableList>
      )}

      <button className="btn btn-dashed card-size" style={{ marginTop: 12 }} onClick={() => setPicking(true)}>
        <Plus />
        {t("routine.addExercise")}
      </button>

      <div className="sticky-cta">
        <button className="btn btn-primary" onClick={save} disabled={busy || loading}>
          {busy ? t("common.saving") : t("routine.save")}
        </button>
      </div>

      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={(ex) => {
            setItems((prev) => [...prev, { key: newKey(), exerciseId: ex.id, name: ex.name, sets: 3 }]);
            setPicking(false);
          }}
        />
      )}
      {swapping !== null && (
        // Same place in the routine, same number of sets — only the exercise changes.
        <ExercisePicker
          title={t("session.replaceExercise")}
          initialPart={exs.get(items[swapping]?.exerciseId ?? -1)?.body_part}
          onClose={() => setSwapping(null)}
          onPick={(ex) => {
            patch(swapping, { exerciseId: ex.id, name: ex.name });
            setSwapping(null);
          }}
        />
      )}
    </div>
  );
}
