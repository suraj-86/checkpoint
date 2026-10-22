import type { ActivityDayPoint } from "../types/progress.types";
import { buildDays, shortDate } from "./chartUtils";

const LEVEL_CLASS = ["bg-slate-200", "bg-indigo-200", "bg-indigo-300", "bg-indigo-500", "bg-indigo-700"];
const WEEKS = 53;
const CELL = 12;
const GAP = 3;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function level(sessions: number): number {
  if (sessions <= 0) return 0;
  if (sessions === 1) return 1;
  if (sessions === 2) return 2;
  if (sessions <= 4) return 3;
  return 4;
}

export function ActivityHeatmap({ data }: { data: ActivityDayPoint[] }) {
  const days = buildDays(WEEKS * 7, data);
  const padding = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const cells: ({ date: string; sessionCount: number } | null)[] = [...Array.from({ length: padding }, () => null), ...days];
  const weeks = Math.ceil(cells.length / 7);

  const labels: { week: number; text: string }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const first = cells.slice(w * 7, w * 7 + 7).find((c) => c !== null);
    if (!first) continue;
    const month = Number(first.date.slice(5, 7)) - 1;
    if (month !== lastMonth) {
      if (labels.length === 0 || w - labels[labels.length - 1].week >= 3) labels.push({ week: w, text: MONTHS[month] });
      lastMonth = month;
    }
  }

  const total = days.reduce((a, d) => a + d.sessionCount, 0);
  const active = days.filter((d) => d.sessionCount > 0).length;
  const stride = CELL + GAP;
  const left = 30;

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-slate-600">
        {total} {total === 1 ? "session" : "sessions"} in the last year, on {active} {active === 1 ? "day" : "days"}
      </p>
      <div className="overflow-x-auto pb-1">
        <div className="relative" style={{ width: left + weeks * stride, height: 18 + 7 * stride }}>
          {labels.map((l) => (
            <span key={l.week} className="absolute top-0 text-[11px] font-semibold text-slate-500" style={{ left: left + l.week * stride }}>
              {l.text}
            </span>
          ))}
          {[1, 3, 5].map((row) => (
            <span
              key={row}
              className="absolute text-[11px] font-semibold text-slate-500"
              style={{ top: 18 + row * stride - 1, left: 0 }}
            >
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][row]}
            </span>
          ))}
          <div
            className="absolute grid grid-flow-col"
            style={{
              top: 18,
              left,
              gridTemplateRows: `repeat(7, ${CELL}px)`,
              gridAutoColumns: `${CELL}px`,
              gap: GAP,
            }}
            role="img"
            aria-label={`Activity over the last year: ${total} sessions on ${active} days`}
          >
            {cells.map((c, i) =>
              c === null ? (
                <i key={`pad-${i}`} />
              ) : (
                <i
                  key={c.date}
                  title={`${shortDate(c.date)}: ${c.sessionCount} session${c.sessionCount === 1 ? "" : "s"}`}
                  className={`rounded-[3px] ${LEVEL_CLASS[level(c.sessionCount)]}`}
                />
              )
            )}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-xs font-semibold text-slate-500">
        Less
        {LEVEL_CLASS.map((c) => (
          <i key={c} className={`h-3 w-3 rounded-[3px] ${c}`} />
        ))}
        More
      </div>
    </div>
  );
}
