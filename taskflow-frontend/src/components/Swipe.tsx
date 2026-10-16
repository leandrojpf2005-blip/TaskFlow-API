import { useRef, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";

type Gesture = { x: number; y: number; id: number; mode: "?" | "h" | "v"; width: number };

/**
 * Swipe a row left to delete it, like Strong. `onSwipe` says whether the row
 * really went: false (a cancelled confirm, a set that can't go) slides it
 * back. Vertical drags are left to the page, so lists still scroll.
 */
export function SwipeRow({
  children,
  onSwipe,
  label,
  className = "",
}: {
  children: ReactNode;
  onSwipe: () => boolean | Promise<boolean>;
  label: string;
  className?: string;
}) {
  const [dx, setDx] = useState(0);
  const [animate, setAnimate] = useState(false);
  const g = useRef<Gesture | null>(null);
  const offset = useRef(0);
  const swiped = useRef(false);

  const move = (v: number) => {
    offset.current = v;
    setDx(v);
  };

  const release = async () => {
    const st = g.current;
    g.current = null;
    if (!st || st.mode !== "h") return;
    setAnimate(true);
    if (offset.current > -Math.min(110, st.width * 0.35)) return move(0);
    move(-st.width);
    await new Promise((r) => setTimeout(r, 180));
    const gone = await onSwipe();
    if (gone) {
      // The row is leaving the list; reset quietly in case this instance is reused.
      setAnimate(false);
      move(0);
    } else {
      move(0);
    }
  };

  return (
    <div className={`swipe ${className}`}>
      <div className="swipe-bg" aria-hidden="true" style={{ opacity: dx < 0 ? 1 : 0 }}>
        <Trash2 />
        <span>{label}</span>
      </div>
      <div
        className="swipe-fg"
        style={{ transform: dx ? `translateX(${dx}px)` : undefined, transition: animate ? "transform .2s ease" : "none" }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          g.current = { x: e.clientX, y: e.clientY, id: e.pointerId, mode: "?", width: e.currentTarget.offsetWidth };
          swiped.current = false;
          setAnimate(false);
        }}
        onPointerMove={(e) => {
          const st = g.current;
          if (!st || e.pointerId !== st.id || st.mode === "v") return;
          const mx = e.clientX - st.x;
          const my = e.clientY - st.y;
          if (st.mode === "?") {
            if (Math.abs(mx) > 8 && Math.abs(mx) > Math.abs(my) * 1.2) {
              st.mode = "h";
              swiped.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
            } else if (Math.abs(my) > 8) {
              st.mode = "v";
              return;
            } else return;
          }
          move(Math.min(0, mx));
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onClickCapture={(e) => {
          // A swipe that ends over a button must not also press it.
          if (swiped.current) {
            e.preventDefault();
            e.stopPropagation();
            swiped.current = false;
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
