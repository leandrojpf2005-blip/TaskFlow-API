import { useEffect, useState } from "react";
import * as api from "../api/workouts";
import type { Exercise } from "../types/workouts";
import { IconChevronLeft } from "./icons";

export function ExerciseSearchSheet({
  onPick,
  onClose,
}: {
  onPick: (e: Exercise) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = q.trim();
    let cancelled = false;
    const timer = setTimeout(() => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      api
        .getExercises(query)
        .then((r) => {
          if (!cancelled) setResults(r.slice(0, 30));
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <button className="backbtn" onClick={onClose}>
          <IconChevronLeft /> Add exercise
        </button>
        <input
          className="input"
          placeholder="Search exercises…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        {loading && <div className="loading">Searching…</div>}
        {!loading && q.trim().length >= 2 && results.length === 0 && (
          <div className="emptystate">No matches.</div>
        )}
        {results.map((ex) => (
          <button className="row tap" key={ex.id} onClick={() => onPick(ex)}>
            <div className="t">
              <b>{ex.name}</b>
              <small>{ex.primary_muscles?.join(", ")}</small>
            </div>
            <span className="chev">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
