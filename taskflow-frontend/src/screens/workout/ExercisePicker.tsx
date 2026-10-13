import { useEffect, useState } from "react";
import { Dumbbell, Plus, Search, SearchX, X } from "lucide-react";
import { getExercises } from "../../api/workouts";
import { useLang } from "../../lib/langHooks";
import { EmptyState, Sheet } from "../../components/ui";
import type { Exercise } from "../../types/workouts";

/** Search the 873-exercise catalogue and pick one. */
export function ExercisePicker({ onPick, onClose }: { onPick: (ex: Exercise) => void; onClose: () => void }) {
  const { t } = useLang();
  const [q, setQ] = useState("");
  const [found, setFound] = useState<{ q: string; list: Exercise[] } | null>(null);
  const query = q.trim();
  const results = query.length >= 2 && found?.q === query ? found.list : null;
  const loading = query.length >= 2 && results === null;

  useEffect(() => {
    if (query.length < 2) return;
    let live = true;
    const timer = window.setTimeout(() => {
      getExercises(query)
        .then((r) => live && setFound({ q: query, list: r.slice(0, 60) }))
        .catch(() => live && setFound({ q: query, list: [] }));
    }, 220);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <Sheet onClose={onClose} title={t("picker.title")}>
      <div className="searchbar" style={{ height: 50, marginBottom: 8 }}>
        <Search />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("picker.search")}
          aria-label={t("picker.search")}
        />
        {q && (
          <button className="clear" onClick={() => setQ("")} aria-label={t("common.clear")}>
            <X />
          </button>
        )}
      </div>

      {results === null ? (
        <p className="muted" style={{ fontSize: 13.5, padding: "10px 2px" }}>
          {loading ? t("food.searching") : t("picker.hint")}
        </p>
      ) : results.length === 0 ? (
        <EmptyState icon={SearchX} title={t("picker.empty")} />
      ) : (
        results.map((ex) => (
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
              <small>{ex.primary_muscles?.join(", ")}</small>
            </span>
            <Plus />
          </button>
        ))
      )}
    </Sheet>
  );
}
