import { useEffect, useMemo, useState } from "react";
import { Plus, Search, SearchX, X } from "lucide-react";
import { useLang } from "../../lib/langHooks";
import {
  BODY_PARTS,
  EQUIPMENT,
  bodyPartLabel,
  equipmentLabel,
  exerciseLabel,
  fold,
  loadCatalogue,
} from "../../lib/exercises";
import { EmptyState, Sheet } from "../../components/ui";
import { ExerciseArt } from "../../components/ExerciseArt";
import type { Exercise } from "../../types/workouts";

// The library is small (~200), so it is filtered locally: switching body part
// or equipment and searching are instant. Search matches the name in the UI
// language and in English, ignoring accents.

/** Pick an exercise: browse by body part and equipment, or search by name. */
export function ExercisePicker({
  onPick,
  onClose,
  title,
  initialPart = null,
}: {
  onPick: (ex: Exercise) => void;
  onClose: () => void;
  title?: string;
  /** Open on this body part (swapping keeps you near the same muscle group). */
  initialPart?: string | null;
}) {
  const { t, lang } = useLang();
  const [all, setAll] = useState<Exercise[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");
  const [part, setPart] = useState<string | null>(initialPart);
  const [equipment, setEquipment] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    loadCatalogue()
      .then((list) => live && setAll(list))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  const sorted = useMemo(
    () =>
      (all ?? [])
        .map((ex) => ({ ex, label: exerciseLabel(ex, lang), hay: fold(`${exerciseLabel(ex, lang)} ${ex.name}`) }))
        .sort((a, b) => a.label.localeCompare(b.label, lang)),
    [all, lang],
  );

  const parts = useMemo(() => BODY_PARTS.filter((p) => sorted.some((r) => r.ex.body_part === p)), [sorted]);
  // Only offer equipment that exists in the chosen body part.
  const kit = useMemo(
    () => EQUIPMENT.filter((eq) => sorted.some((r) => r.ex.equipment === eq && (!part || r.ex.body_part === part))),
    [sorted, part],
  );
  const eq = equipment && kit.includes(equipment) ? equipment : null;

  const needle = fold(q.trim());
  const filtered = sorted.filter(
    (r) =>
      (!part || r.ex.body_part === part) && (!eq || r.ex.equipment === eq) && (!needle || r.hay.includes(needle)),
  );

  return (
    <Sheet onClose={onClose} title={title ?? t("picker.title")} subtitle={all ? t("picker.count", { n: all.length }) : undefined}>
      <div className="searchbar" style={{ height: 50, marginBottom: 10 }}>
        <Search />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("picker.search")} aria-label={t("picker.search")} />
        {q && (
          <button className="clear" onClick={() => setQ("")} aria-label={t("common.clear")}>
            <X />
          </button>
        )}
      </div>

      {parts.length > 0 && (
        <>
          <div className="metric-chips tight" role="radiogroup" aria-label={t("picker.title")}>
            <button className={part === null ? "on" : ""} onClick={() => setPart(null)} role="radio" aria-checked={part === null}>
              {t("picker.all")}
            </button>
            {parts.map((p) => (
              <button key={p} className={part === p ? "on" : ""} onClick={() => setPart(p)} role="radio" aria-checked={part === p}>
                {bodyPartLabel(p, lang)}
              </button>
            ))}
          </div>
          {kit.length > 1 && (
            <div className="metric-chips sm" role="radiogroup" aria-label={t("picker.anyEquipment")}>
              <button className={eq === null ? "on" : ""} onClick={() => setEquipment(null)} role="radio" aria-checked={eq === null}>
                {t("picker.anyEquipment")}
              </button>
              {kit.map((k) => (
                <button key={k} className={eq === k ? "on" : ""} onClick={() => setEquipment(k)} role="radio" aria-checked={eq === k}>
                  {equipmentLabel(k, lang)}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {failed ? (
        <EmptyState icon={SearchX} title={t("common.error")} />
      ) : all === null ? (
        <p className="muted" style={{ fontSize: 13.5, padding: "10px 2px" }}>
          {t("common.loading")}
        </p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={SearchX} title={t("picker.empty")} />
      ) : (
        filtered.map(({ ex, label }) => (
          <button className="ex-pick" key={ex.id} onClick={() => onPick(ex)}>
            <ExerciseArt ex={ex} />
            <span className="grow">
              <b>{label}</b>
              <small>
                {[ex.body_part && bodyPartLabel(ex.body_part, lang), ex.equipment && equipmentLabel(ex.equipment, lang)]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            </span>
            <Plus />
          </button>
        ))
      )}
    </Sheet>
  );
}
