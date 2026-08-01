import { addDays, formatLong, isToday, todayISO } from "../lib/date";

interface DateNavProps {
  date: string;
  onChange: (date: string) => void;
}

export function DateNav({ date, onChange }: DateNavProps) {
  const today = isToday(date);

  return (
    <div className="datenav">
      <button className="datenav-arrow" onClick={() => onChange(addDays(date, -1))} aria-label="Previous day">
        ‹
      </button>

      <button
        className={`datenav-pill ${today ? "datenav-pill--today" : ""}`}
        onClick={() => onChange(todayISO())}
        title={today ? "Today" : "Jump to today"}
      >
        <span className="datenav-dot" aria-hidden />
        {today ? "Today" : formatLong(date)}
      </button>

      <button className="datenav-arrow" onClick={() => onChange(addDays(date, 1))} aria-label="Next day">
        ›
      </button>
    </div>
  );
}
