import type { ActivityDayPoint } from "../types/progress.types";
import { buildDays } from "./chartUtils";

export function WeekStrip({ data }: { data: ActivityDayPoint[] }) {
  const days = buildDays(7, data);
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d, i) => {
        const label = new Date(`${d.date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" });
        const active = d.sessionCount > 0;
        return (
          <div key={d.date} title={`${d.date}: ${d.sessionCount} session(s)`} className="text-center">
            <div
              className={`flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition ${
                active ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200" : "bg-indigo-50 text-slate-300"
              } ${i === 6 ? "ring-2 ring-indigo-300 ring-offset-1" : ""}`}
            >
              {active ? d.sessionCount : "·"}
            </div>
            <span className="mt-1 block text-[11px] text-slate-500">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
