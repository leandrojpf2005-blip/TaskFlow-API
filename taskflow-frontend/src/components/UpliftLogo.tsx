// Uplift mark: tri-segment macro ring + up arrow. White by default (for the
// orange hero/welcome). Pass a className for sizing.
export function UpliftLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-label="Uplift">
      <g transform="rotate(-90 32 32)" fill="none" strokeWidth="5" strokeLinecap="round">
        <circle cx="32" cy="32" r="15" stroke="#fff" strokeDasharray="22 72.25" />
        <circle cx="32" cy="32" r="15" stroke="#ffd3be" strokeDasharray="22 72.25" strokeDashoffset="-31.4" />
        <circle cx="32" cy="32" r="15" stroke="#ffe9dc" strokeDasharray="22 72.25" strokeDashoffset="-62.8" />
      </g>
      <path
        d="M32 40V25M26 31l6-6 6 6"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
