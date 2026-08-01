import type { ReactNode } from "react";

// Generic circular progress ring, reused for the big calorie ring and the
// small per-macro rings.

interface MacroRingProps {
  value: number;
  target: number;
  size: number;
  stroke: number;
  color: string;
  center?: ReactNode;
}

export function MacroRing({ value, target, size, stroke, color, center }: MacroRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const dash = circumference * pct;
  const over = value > target;

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={over ? "var(--danger)" : color}
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      {center && <div className="ring-center">{center}</div>}
    </div>
  );
}
