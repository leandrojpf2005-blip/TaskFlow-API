import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Folder as FolderIcon,
  FolderInput,
  FolderPlus,
  LayoutTemplate,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import * as api from "../../api/workouts";
import { useApp } from "../../lib/appData";
import { useNav } from "../../lib/nav";
import { useLang } from "../../lib/langHooks";
import { useExerciseName } from "../../lib/exercises";
import { Chip, EmptyState, ErrorBanner, ITile, MenuButton, Sheet, errText, useConfirm } from "../../components/ui";
import { RoutineBuilder } from "./RoutineBuilder";
import { routineToSession } from "./start";
import type { useStarter } from "./useStarter";
import type { Folder, Routine, RoutineExercise } from "../../types/workouts";

// Folders the user collapsed, remembered on this device only.
const CLOSED_KEY = "uplift_closed_folders";
function loadClosed(): Set<number> {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLOSED_KEY) ?? "[]") as number[]);
  } catch {
    return new Set();
  }
}

/**
 * "Rotinas": routines grouped in folders ("spaces" like Push / Pull / Legs),
 * then the ones in no folder. Without /folders on the server it is the plain
 * list it always was.
 */
export function RoutinesPane({
  routines,
  details,
  starter,
  onDelete,
}: {
  routines: Routine[] | null;
  details: Record<number, RoutineExercise[]>;
  starter: ReturnType<typeof useStarter>;
  onDelete: (r: Routine) => void;
}) {
  const { t } = useLang();
  const nav = useNav();
  const { version, bump, toast } = useApp();
  const [folders, setFolders] = useState<Folder[] | null>(null); // null: not supported (yet)
  const [closed, setClosed] = useState<Set<number>>(loadClosed);
  const [naming, setNaming] = useState<{ folder?: Folder } | null>(null); // new or rename
  const [moving, setMoving] = useState<Routine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmNode, ask] = useConfirm();

  useEffect(() => {
    let live = true;
    api
      .getFolders()
      .then((fs) => live && setFolders(fs))
      .catch(() => live && setFolders(null));
    return () => {
      live = false;
    };
  }, [version.routines]);

  const toggle = (id: number) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(CLOSED_KEY, JSON.stringify([...next]));
      } catch {
        /* storage blocked: it just won't be remembered */
      }
      return next;
    });

  const removeFolder = async (f: Folder) => {
    const ok = await ask({ title: `${t("folders.delete")} «${f.name}»?`, text: t("folders.deleteText"), confirm: t("common.delete"), cancel: t("common.cancel"), danger: true });
    if (!ok) return;
    try {
      await api.deleteFolder(f.id);
      bump("routines");
    } catch (e) {
      setError(errText(e, t));
    }
  };

  // Moving keeps everything else: PUT sends the routine's name and exercises as they are.
  const moveTo = async (r: Routine, folder: Folder | null) => {
    setMoving(null);
    if ((r.folder_id ?? null) === (folder?.id ?? null)) return;
    try {
      const items = details[r.id] ?? (await api.getRoutineExercises(r.id));
      await api.updateRoutine(r.id, {
        name: r.name,
        items: items.map((e) => ({ exercise_id: e.exercise_id, sets: e.sets })),
        folder_id: folder?.id ?? null,
      });
      bump("routines");
      toast(t("folders.moved", { name: folder?.name ?? t("folders.none") }));
    } catch (e) {
      setError(errText(e, t));
    }
  };

  const card = (r: Routine) => (
    <RoutineCard
      key={r.id}
      routine={r}
      exs={details[r.id]}
      starter={starter}
      onMove={folders && folders.length > 0 ? () => setMoving(r) : undefined}
      onDelete={() => onDelete(r)}
    />
  );

  const known = new Set((folders ?? []).map((f) => f.id));
  const loose = (routines ?? []).filter((r) => !r.folder_id || !known.has(r.folder_id));

  return (
    <>
      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => nav.push(<RoutineBuilder />)}>
          <Plus />
          {t("workout.newRoutine")}
        </button>
        {folders && (
          <button className="btn btn-outline" onClick={() => setNaming({})}>
            <FolderPlus />
            {t("folders.new")}
          </button>
        )}
      </div>
      <ErrorBanner message={error} onClose={() => setError(null)} />

      {routines === null ? (
        <p className="splash">{t("common.loading")}</p>
      ) : routines.length === 0 && !folders?.length ? (
        <EmptyState icon={LayoutTemplate} title={t("workout.noRoutines")} text={t("workout.noRoutinesHint")} />
      ) : (
        <>
          {(folders ?? []).map((f) => {
            const inside = routines.filter((r) => r.folder_id === f.id);
            const open = !closed.has(f.id);
            return (
              <section className="folder" key={f.id}>
                <div className="folder-head">
                  <button className="folder-toggle" onClick={() => toggle(f.id)} aria-expanded={open} aria-label={t("folders.toggle", { name: f.name })}>
                    <FolderIcon />
                    <b>{f.name}</b>
                    <span className="count">{inside.length}</span>
                    <ChevronDown className={open ? "" : "shut"} />
                  </button>
                  <MenuButton
                    label={f.name}
                    items={[
                      { label: t("folders.newRoutineHere"), icon: Plus, onClick: () => nav.push(<RoutineBuilder folderId={f.id} />) },
                      { label: t("folders.rename"), icon: Pencil, onClick: () => setNaming({ folder: f }) },
                      { label: t("folders.delete"), icon: Trash2, onClick: () => removeFolder(f), danger: true },
                    ]}
                  />
                </div>
                {open &&
                  (inside.length > 0 ? (
                    inside.map(card)
                  ) : (
                    <button className="btn btn-dashed folder-empty" onClick={() => nav.push(<RoutineBuilder folderId={f.id} />)}>
                      <Plus />
                      {t("folders.newRoutineHere")}
                    </button>
                  ))}
              </section>
            );
          })}

          {loose.length > 0 && (
            <section className="folder loose">
              {folders && folders.length > 0 && (
                <div className="folder-head">
                  <span className="folder-toggle static">
                    <b>{t("folders.other")}</b>
                    <span className="count">{loose.length}</span>
                  </span>
                </div>
              )}
              {loose.map(card)}
            </section>
          )}
        </>
      )}

      {naming && (
        <FolderNameSheet
          folder={naming.folder}
          onClose={() => setNaming(null)}
          onSaved={() => {
            setNaming(null);
            bump("routines");
          }}
        />
      )}
      {moving && folders && (
        <Sheet onClose={() => setMoving(null)} title={t("folders.move")} subtitle={moving.name}>
          <div className="choice-list">
            {[null, ...folders].map((f) => {
              const here = (moving.folder_id ?? null) === (f?.id ?? null);
              return (
                <button key={f?.id ?? "none"} className={here ? "on" : ""} onClick={() => moveTo(moving, f)}>
                  <FolderIcon />
                  <span>{f?.name ?? t("folders.none")}</span>
                  {here && <Check />}
                </button>
              );
            })}
          </div>
        </Sheet>
      )}
      {confirmNode}
    </>
  );
}

function RoutineCard({
  routine: r,
  exs,
  starter,
  onMove,
  onDelete,
}: {
  routine: Routine;
  exs?: RoutineExercise[];
  starter: ReturnType<typeof useStarter>;
  onMove?: () => void;
  onDelete: () => void;
}) {
  const { t } = useLang();
  const nav = useNav();
  const exName = useExerciseName();
  const sets = exs?.reduce((a, e) => a + e.sets, 0) ?? 0;
  const start = () => starter.start(() => routineToSession(r));

  return (
    <section className="card">
      <div className="routine-row">
        <ITile icon={LayoutTemplate} />
        <button className="grow" onClick={start} disabled={starter.starting}>
          <b>{r.name}</b>
          <small>
            {exs ? `${t("workout.exercisesCount", { n: exs.length })} · ${t("workout.setsCount", { n: sets })}` : t("common.loading")}
          </small>
        </button>
        <MenuButton
          label={t("workout.routineMenu")}
          items={[
            { label: t("workout.startRoutine"), icon: Play, onClick: start },
            { label: t("workout.editRoutine"), icon: Pencil, onClick: () => nav.push(<RoutineBuilder routine={r} />) },
            ...(onMove ? [{ label: t("folders.move"), icon: FolderInput, onClick: onMove }] : []),
            { label: t("workout.deleteRoutine"), icon: Trash2, onClick: onDelete, danger: true },
          ]}
        />
      </div>
      {exs && exs.length > 0 && (
        <div className="routine-row" style={{ marginTop: 10 }}>
          <div className="chips" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {exs.slice(0, 4).map((e, i) => (
              <Chip key={i} tone="neutral" size="sm">
                {e.sets}× {exName(e.exercise_id, e.name)}
              </Chip>
            ))}
            {exs.length > 4 && (
              <Chip tone="neutral" size="sm">
                +{exs.length - 4}
              </Chip>
            )}
          </div>
        </div>
      )}
      <button className="btn btn-secondary" style={{ marginTop: 12, minHeight: 44 }} onClick={start} disabled={starter.starting}>
        <Play />
        {t("workout.startRoutine")}
      </button>
    </section>
  );
}

/** Name a new folder, or rename one. */
function FolderNameSheet({ folder, onClose, onSaved }: { folder?: Folder; onClose: () => void; onSaved: () => void }) {
  const { t } = useLang();
  const [name, setName] = useState(folder?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) return setError(t("folders.needName"));
    setBusy(true);
    try {
      if (folder) await api.renameFolder(folder.id, name.trim());
      else await api.createFolder(name.trim());
      onSaved();
    } catch (e) {
      setError(errText(e, t));
      setBusy(false);
    }
  };

  return (
    <Sheet onClose={onClose} title={folder ? t("folders.rename") : t("folders.new")}>
      <ErrorBanner message={error} onClose={() => setError(null)} />
      <label className="field">
        <span>{t("folders.name")}</span>
        <input
          className="input"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder={t("folders.namePlaceholder")}
        />
      </label>
      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={save} disabled={busy}>
        {busy ? t("common.saving") : t("folders.save")}
      </button>
    </Sheet>
  );
}
