import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ActivityDayPoint } from "../types/progress.types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function iso(y: number, m: number, d: number): string {
  return new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
}

function shade(count: number): string {
  if (count <= 0) return "";
  if (count === 1) return "bg-indigo-200 text-indigo-900";
  if (count === 2) return "bg-indigo-400 text-white";
  return "bg-indigo-600 text-white";
}

export function HistoryCalendar({
  data,
  selected,
  onPick,
}: {
  data: ActivityDayPoint[];
  selected: string;
  onPick: (date: string) => void;
}) {
  const now = new Date();
  const todayIso = iso(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const [cursor, setCursor] = useState({ y: now.getUTCFullYear(), m: now.getUTCMonth() });

  const counts = new Map(data.map((d) => [d.date, d.sessionCount]));
  const first = new Date(Date.UTC(cursor.y, cursor.m, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => iso(cursor.y, cursor.m, i + 1)),
  ];

  const atCurrentMonth = cursor.y === now.getUTCFullYear() && cursor.m === now.getUTCMonth();
  const label = first.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
  const monthTotal = cells.reduce((sum, d) => sum + (d ? counts.get(d) ?? 0 : 0), 0);

  function move(delta: number) {
    setCursor((c) => {
      const d = new Date(Date.UTC(c.y, c.m + delta, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => move(-1)} aria-label="Previous month" className="btn-secondary !px-2.5 !py-1.5">
          <ChevronLeft size={15} />
        </button>
        <div className="text-center">
          <b className="font-display text-lg text-slate-800">{label}</b>
          <p className="text-xs text-slate-500">
            {monthTotal} {monthTotal === 1 ? "session" : "sessions"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={atCurrentMonth}
          aria-label="Next month"
          className="btn-secondary !px-2.5 !py-1.5"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold uppercase text-slate-500">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {cells.map((date, i) => {
          if (!date) return <span key={`gap-${i}`} />;
          const count = counts.get(date) ?? 0;
          const future = date > todayIso;
          const picked = selected === date;
          return (
            <button
              key={date}
              type="button"
              disabled={future}
              onClick={() => onPick(picked ? "" : date)}
              aria-pressed={picked}
              title={`${date}: ${count} ${count === 1 ? "session" : "sessions"}`}
              className={`aspect-square rounded-xl border-2 text-sm font-bold transition disabled:opacity-40 ${
                picked ? "border-amber-400 ring-2 ring-amber-300" : date === todayIso ? "border-indigo-500" : "border-transparent"
              } ${shade(count) || "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {Number(date.slice(8))}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          Less
          {["bg-slate-200", "bg-indigo-200", "bg-indigo-400", "bg-indigo-600"].map((c) => (
            <i key={c} className={`inline-block h-3 w-3 rounded ${c}`} />
          ))}
          More
        </span>
        {selected && (
          <button type="button" onClick={() => onPick("")} className="font-bold text-indigo-600 hover:underline">
            Clear day
          </button>
        )}
      </div>
    </div>
  );
}
