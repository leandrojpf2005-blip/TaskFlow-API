// A circular progress ring for calories consumed vs. target.

interface MacroRingProps {
  consumed: number;
  target: number;
}

export function MacroRing({ consumed, target }: MacroRingProps) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const dash = circumference * pct;
  const remaining = Math.max(target - consumed, 0);
  const over = consumed > target;

  return (
    <div className="ring">
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle
          className="ring-track"
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          strokeWidth="12"
        />
        <circle
          className={`ring-value ${over ? "ring-value--over" : ""}`}
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 75 75)"
        />
      </svg>
      <div className="ring-center">
        <strong className="ring-number">{remaining}</strong>
        <span className="ring-caption">{over ? "over" : "kcal left"}</span>
      </div>
    </div>
  );
}
