// Line icons (stroke = currentColor) used in the tab bar and headers.
const s = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const IconHome = () => (
  <svg viewBox="0 0 24 24">
    <path d="M4 12l8-7 8 7M6 10.5V19h4v-5h4v5h4v-8.5" {...s} />
  </svg>
);
export const IconDiary = () => (
  <svg viewBox="0 0 24 24">
    <rect x="5" y="4" width="14" height="16" rx="2.5" {...s} />
    <path d="M9 9h6M9 13h6" {...s} />
  </svg>
);
export const IconDumbbell = () => (
  <svg viewBox="0 0 24 24">
    <path d="M4 9v6M7 7.5v9M17 7.5v9M20 9v6M7 12h10" {...s} />
  </svg>
);
export const IconUser = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" {...s} />
    <path d="M4.5 20c.5-4 3.8-6 7.5-6s7 2 7.5 6" {...s} />
  </svg>
);
export const IconPlus = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 6v12M6 12h12" {...s} strokeWidth={2.4} />
  </svg>
);
export const IconChevronLeft = () => (
  <svg viewBox="0 0 24 24">
    <path d="M15 5l-7 7 7 7" {...s} strokeWidth={2.2} />
  </svg>
);
export const IconChevronRight = () => (
  <svg viewBox="0 0 24 24">
    <path d="M9 5l7 7-7 7" {...s} strokeWidth={2.2} />
  </svg>
);
