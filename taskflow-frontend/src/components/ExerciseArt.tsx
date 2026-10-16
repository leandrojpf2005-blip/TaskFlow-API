import type { CSSProperties } from "react";
import { Dumbbell } from "lucide-react";
import { exerciseArt, type Layer } from "../lib/exerciseArt";

const STYLE: Record<Layer, CSSProperties> = {
  env: { stroke: "var(--fg)", fill: "var(--fg)", opacity: 0.22 },
  far: { stroke: "var(--accent)", fill: "var(--accent)", opacity: 0.38 },
  fargear: { stroke: "var(--fg)", fill: "var(--fg)", opacity: 0.3 },
  halo: { stroke: "var(--art-bg)", fill: "var(--art-bg)" },
  gear: { stroke: "var(--fg)", fill: "var(--fg)", opacity: 0.62 },
  fig: { stroke: "var(--accent)", fill: "var(--accent)" },
};

type ArtEx = { slug?: string | null; equipment?: string | null } | null | undefined;

/** An exercise's line drawing in a tile; a dumbbell icon when it has none. */
export function ExerciseArt({ ex, size = "md" }: { ex: ArtEx; size?: "md" | "lg" }) {
  const shapes = ex ? exerciseArt(ex) : null;
  return (
    <span className={`ex-art ${size}`} aria-hidden="true">
      {shapes ? (
        <svg viewBox="0 0 48 48" strokeLinecap="round" strokeLinejoin="round">
          {shapes.map((s, i) =>
            s.k === "path" ? (
              <path
                key={i}
                d={s.d}
                style={{ ...STYLE[s.layer], fill: "none", strokeWidth: s.w ?? (s.layer === "env" ? 2.2 : 3.2) }}
              />
            ) : (
              <circle
                key={i}
                cx={s.c[0]}
                cy={s.c[1]}
                r={s.r}
                style={s.fill ? { ...STYLE[s.layer], stroke: "none" } : { ...STYLE[s.layer], fill: "none", strokeWidth: s.w ?? 2.4 }}
              />
            ),
          )}
        </svg>
      ) : (
        <Dumbbell />
      )}
    </span>
  );
}
