/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Ellipsis, Info as InfoIcon, Minus, Plus, X, type LucideIcon } from "lucide-react";
import { ApiError } from "../api/client";
import type { Translate } from "../lib/i18n";

// Shared building blocks for every screen. Class names map 1:1 to index.css.

type Tone = "green" | "coral" | "beige" | "solid" | "glass";

export function TabHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="tab-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {right && <div className="head-actions">{right}</div>}
    </header>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backIcon: BackIcon = ArrowLeft,
  backLabel,
  right,
}: {
  title: string;
  subtitle?: ReactNode;
  onBack?: () => void;
  backIcon?: LucideIcon;
  backLabel?: string;
  right?: ReactNode;
}) {
  return (
    <header className="screen-head">
      {onBack && (
        <button className="round-btn" onClick={onBack} aria-label={backLabel ?? "Back"}>
          <BackIcon />
        </button>
      )}
      <div className="titles">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  small,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  /** Smaller labels, for three long options (the Recipes tabs). */
  small?: boolean;
}) {
  return (
    <div className={`segmented${small ? " sm" : ""}`} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          className={value === o.value ? "on" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Pills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="pills" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? "on" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({
  tone = "green",
  icon: Icon,
  size,
  children,
}: {
  tone?: "green" | "coral" | "neutral" | "dark";
  icon?: LucideIcon;
  size?: "sm" | "lg";
  children: ReactNode;
}) {
  return (
    <span className={`chip ${tone}${size ? ` ${size}` : ""}`}>
      {Icon && <Icon />}
      {children}
    </span>
  );
}

export function ITile({
  icon: Icon,
  tone = "green",
  size,
  round,
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: "sm" | "lg";
  round?: boolean;
}) {
  return (
    <span className={`itile ${tone === "green" ? "" : tone}${size ? ` ${size}` : ""}${round ? " round" : ""}`}>
      <Icon />
    </span>
  );
}

export function LetterBadge({
  text,
  tone,
  size,
}: {
  text: string;
  tone?: "green" | "coral" | "beige";
  size?: "lg";
}) {
  const letter = text.trim().charAt(0) || "·";
  return (
    <span className={`lbadge${tone ? ` ${tone}` : ""}${size ? ` ${size}` : ""}`} aria-hidden>
      {letter}
    </span>
  );
}

export function PBar({
  value,
  max,
  thin,
  color,
  track,
  tone,
}: {
  value: number;
  max: number;
  thin?: boolean;
  color?: string;
  track?: string;
  tone?: "coral";
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      className={`pbar${thin ? " thin" : ""}${tone ? ` ${tone}` : ""}`}
      style={track ? { background: track } : undefined}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <i style={{ width: `${pct}%`, ...(color ? { background: color } : {}) }} />
    </div>
  );
}

export function StatTile({
  icon: Icon,
  value,
  unit,
  label,
}: {
  icon?: LucideIcon;
  value: ReactNode;
  unit?: string;
  label: string;
}) {
  return (
    <div className="stat">
      {Icon && <Icon />}
      <b className="tnum">
        {value}
        {unit && <small>{unit}</small>}
      </b>
      <span>{label}</span>
    </div>
  );
}

export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Icon />
      <b>{title}</b>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function Info({ children }: { children: ReactNode }) {
  return (
    <div className="info">
      <InfoIcon />
      <span>{children}</span>
    </div>
  );
}

export function ErrorBanner({ message, onClose }: { message: string | null; onClose?: () => void }) {
  if (!message) return null;
  return (
    <div className="error-banner" role="alert">
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss">
          <X />
        </button>
      )}
    </div>
  );
}

export function Sheet({
  onClose,
  title,
  subtitle,
  children,
}: {
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {title && <h2>{title}</h2>}
        {subtitle && <p className="sheet-sub">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

/** Big −  value  + control used for body weight and portion size. */
export function Stepper({
  value,
  onChange,
  onStep,
  unit,
  label,
}: {
  value: string;
  onChange: (raw: string) => void;
  onStep: (direction: 1 | -1) => void;
  unit: string;
  label: string;
}) {
  return (
    <div className="stepper">
      <button className="step" onClick={() => onStep(-1)} aria-label="−">
        <Minus />
      </button>
      <label className="value">
        <span className="sr-only">{label}</span>
        <input
          className="tnum"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          style={{ width: `${Math.max(1.6, value.replace(/[.,]/g, "").length + (/[.,]/.test(value) ? 0.45 : 0)) + 0.25}ch` }}
        />
        <span>{unit}</span>
      </label>
      <button className="step plus" onClick={() => onStep(1)} aria-label="+">
        <Plus />
      </button>
    </div>
  );
}

/** Progress ring for the daily-calories card. */
export function Ring({
  value,
  max,
  size,
  stroke,
  children,
}: {
  value: number;
  max: number;
  size: number;
  stroke: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const over = max > 0 && value > max;
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? "var(--coral)" : "var(--accent)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          style={{ transition: "stroke-dasharray 0.4s ease" }}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

export function MacroDots({
  protein,
  carbs,
  fat,
  suffix,
  muted,
  fmt,
}: {
  protein: number;
  carbs: number;
  fat: number;
  suffix?: [string, string, string];
  muted?: boolean;
  fmt: (n: number) => string;
}) {
  const [sp, sc, sf] = suffix ?? ["g", "g", "g"];
  return (
    <p className={`macro-line${muted ? " muted-text" : ""}`}>
      <i className="mdot" style={{ background: "var(--p)" }} /> {fmt(protein)}
      {sp}
      <i className="mdot" style={{ background: "var(--c)" }} /> {fmt(carbs)}
      {sc}
      <i className="mdot" style={{ background: "var(--f)" }} /> {fmt(fat)}
      {sf}
    </p>
  );
}

export function MenuButton({
  label,
  items,
}: {
  label: string;
  items: { label: string; icon: LucideIcon; onClick: () => void; danger?: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Open upwards when the list wouldn't fit above the bottom tab bar.
  const toggle = () => {
    if (!open && ref.current) {
      const below = window.innerHeight - ref.current.getBoundingClientRect().bottom;
      setUp(below < items.length * 42 + 110);
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="menu-anchor" ref={ref}>
      <button className="round-btn sm" onClick={toggle} aria-label={label} aria-expanded={open}>
        <Ellipsis />
      </button>
      {open && (
        <div className={`menu-pop${up ? " up" : ""}`} role="menu">
          {items.map((it) => (
            <button
              key={it.label}
              role="menuitem"
              className={it.danger ? "danger" : ""}
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
            >
              <it.icon />
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Promise-based confirmation sheet: `if (await ask({...})) …`. */
export function useConfirm(): [
  ReactNode,
  (o: { title: string; text?: string; confirm: string; cancel: string; danger?: boolean }) => Promise<boolean>,
] {
  const [state, setState] = useState<{
    title: string;
    text?: string;
    confirm: string;
    cancel: string;
    danger?: boolean;
    resolve: (v: boolean) => void;
  } | null>(null);

  const ask = useCallback(
    (o: { title: string; text?: string; confirm: string; cancel: string; danger?: boolean }) =>
      new Promise<boolean>((resolve) => setState({ ...o, resolve })),
    [],
  );

  const close = (v: boolean) => {
    state?.resolve(v);
    setState(null);
  };

  const node = state ? (
    <Sheet onClose={() => close(false)} title={state.title} subtitle={state.text}>
      <button className={`btn ${state.danger ? "btn-danger" : "btn-primary"}`} onClick={() => close(true)}>
        {state.confirm}
      </button>
      <button className="btn btn-text" onClick={() => close(false)}>
        {state.cancel}
      </button>
    </Sheet>
  ) : null;

  return [node, ask];
}

/** Human error text: the API's detail when it is a sentence, else a generic line. */
export function errText(e: unknown, t: Translate): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return t("common.sessionExpired");
    if (e.status >= 500) return t("common.serverError");
    if (e.message && !e.message.startsWith("[") && !e.message.startsWith("{") && e.message.length < 120) {
      return e.message;
    }
    return t("common.error");
  }
  if (e instanceof TypeError) return t("common.offline");
  return t("common.error");
}
