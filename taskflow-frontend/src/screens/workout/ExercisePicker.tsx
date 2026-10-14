import { useEffect, useMemo, useState } from "react";
import { Dumbbell, Plus, Search, SearchX, X } from "lucide-react";
import { getExercises } from "../../api/workouts";
import { useLang } from "../../lib/langHooks";
import { muscleLabel } from "../../lib/muscles";
import { EmptyState, Sheet } from "../../components/ui";
import type { Exercise } from "../../types/workouts";

// The whole catalogue is fetched once per session and filtered locally, so
// browsing by muscle and searching are instant. Above BROWSE_LIMIT exercises
// the list waits for a muscle group or a search instead of rendering them all.
const BROWSE_LIMIT = 200;
const RENDER_CAP = 150;

let catalogue: Promise<Exercise[]> | null = null;
function loadCatalogue(): Promise<Exercise[]> {
  if (!catalogue) {
    catalogue = getExercises().catch((e) => {
      catalogue = null; // let the next open retry
      throw e;
    });
  }
  return catalogue;
}

/** Pick an exercise: browse by muscle group or search by name. */
export function ExercisePicker({ onPick, onClose }: { onPick: (ex: Exercise) => void; onClose: () => void }) {
  const { t, lang } = useLang();
  const [all, setAll] = useState<Exercise[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    loadCatalogue()
      .then((list) => live && setAll([...list].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  const groups = useMemo(() => {
    const count = new Map<string, number>();
    for (const ex of all ?? []) {
      const m = ex.primary_muscles?.[0];
      if (m) count.set(m, (count.get(m) ?? 0) + 1);
    }
    return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([m]) => m);
  }, [all]);

  const needle = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      (all ?? []).filter(
        (ex) =>
          (!muscle || ex.primary_muscles?.[0] === muscle) && (!needle || ex.name.toLowerCase().includes(needle)),
      ),
    [all, muscle, needle],
  );
  const waitForChoice = (all?.length ?? 0) > BROWSE_LIMIT && !muscle && !needle;

  return (
    <Sheet onClose={onClose} title={t("picker.title")} subtitle={all ? t("picker.count", { n: all.length }) : undefined}>
      <div className="searchbar" style={{ height: 50, marginBottom: 10 }}>
        <Search />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("picker.search")} aria-label={t("picker.search")} />
        {q && (
          <button className="clear" onClick={() => setQ("")} aria-label={t("common.clear")}>
            <X />
          </button>
        )}
      </div>

      {groups.length > 0 && (
        <div className="metric-chips" role="radiogroup" aria-label={t("picker.title")}>
          <button className={muscle === null ? "on" : ""} onClick={() => setMuscle(null)} role="radio" aria-checked={muscle === null}>
            {t("picker.all")}
          </button>
          {groups.map((m) => (
            <button key={m} className={muscle === m ? "on" : ""} onClick={() => setMuscle(m)} role="radio" aria-checked={muscle === m}>
              {muscleLabel(m, lang)}
            </button>
          ))}
        </div>
      )}

      {failed ? (
        <EmptyState icon={SearchX} title={t("common.error")} />
      ) : all === null ? (
        <p className="muted" style={{ fontSize: 13.5, padding: "10px 2px" }}>
          {t("common.loading")}
        </p>
      ) : waitForChoice ? (
        <p className="muted" style={{ fontSize: 13.5, padding: "10px 2px" }}>
          {t("picker.chooseGroup")}
        </p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={SearchX} title={t("picker.empty")} />
      ) : (
        filtered.slice(0, RENDER_CAP).map((ex) => (
          <button className="ex-pick" key={ex.id} onClick={() => onPick(ex)}>
            {ex.images?.[0] ? (
              <img src={ex.images[0]} alt="" loading="lazy" />
            ) : (
              <span className="ph itile">
                <Dumbbell />
              </span>
            )}
            <span className="grow">
              <b>{ex.name}</b>
              <small>{(ex.primary_muscles ?? []).map((m) => muscleLabel(m, lang)).join(", ")}</small>
            </span>
            <Plus />
          </button>
        ))
      )}
    </Sheet>
  );
}
