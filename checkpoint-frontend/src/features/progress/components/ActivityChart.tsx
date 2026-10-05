import type { ActivityDayPoint } from "../types/progress.types";

/**
 * Deliberately simple CSS-bar chart rather than pulling in a charting
 * library for one view — matches the "deliberately simple for V1" spirit
 * elsewhere in this project. Shows the last `days` calendar days; days
 * with no activity render as an empty slot, not a missing one.
 */
export function ActivityChart({ data, days }: { data: ActivityDayPoint[]; days: number }) {
  const byDate = new Map(data.map((d) => [d.date, d]));
  const today = new Date();
  const allDays: { date: string; sessionCount: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    allDays.push({ date: iso, sessionCount: byDate.get(iso)?.sessionCount ?? 0 });
  }

  const max = Math.max(1, ...allDays.map((d) => d.sessionCount));

  return (
    <div className="flex h-24 items-end gap-0.5">
      {allDays.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${d.sessionCount} session${d.sessionCount === 1 ? "" : "s"}`}
          className="flex-1 rounded-t bg-slate-700 transition-opacity hover:opacity-70"
          style={{
            height: `${(d.sessionCount / max) * 100}%`,
            minHeight: d.sessionCount > 0 ? "4px" : "1px",
            backgroundColor: d.sessionCount > 0 ? undefined : "#e2e8f0",
          }}
        />
      ))}
    </div>
  );
}
