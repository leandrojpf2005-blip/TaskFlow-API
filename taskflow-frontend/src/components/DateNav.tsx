import { addDays, formatLong, isToday, todayISO } from "../lib/date";

interface DateNavProps {
  date: string;
  onChange: (date: string) => void;
}

export function DateNav({ date, onChange }: DateNavProps) {
  const today = isToday(date);

  return (
    <div className="datenav">
      <button
        className="datenav-arrow"
        onClick={() => onChange(addDays(date, -1))}
        aria-label="Previous day"
      >
        ‹
      </button>

      <div className="datenav-label">
        <span className="datenav-day">{today ? "Today" : formatLong(date)}</span>
        {today && <span className="datenav-sub">{formatLong(date)}</span>}
        {!today && (
          <button className="datenav-today" onClick={() => onChange(todayISO())}>
            Jump to today
          </button>
        )}
      </div>

      <button
        className="datenav-arrow"
        onClick={() => onChange(addDays(date, 1))}
        aria-label="Next day"
      >
        ›
      </button>
    </div>
  );
}
