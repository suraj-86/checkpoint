import { useId } from "react";
import type { ActivityDayPoint } from "../types/progress.types";

const WIDTH = 600;
const HEIGHT = 170;
const PAD_X = 10;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;

interface Day {
  date: string;
  sessionCount: number;
}

// The backend groups activity by UTC calendar day, so the chart does the same.
function buildDays(days: number, data: ActivityDayPoint[]): Day[] {
  const byDate = new Map(data.map((d) => [d.date, d]));
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: days }, (_, k) => {
    const date = new Date(todayUtc - (days - 1 - k) * 86_400_000).toISOString().slice(0, 10);
    return { date, sessionCount: byDate.get(date)?.sessionCount ?? 0 };
  });
}

function smoothPath(points: [number, number][], floor: number): string {
  if (points.length < 2) return "";
  const clampY = (y: number) => Math.min(floor, y);
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = clampY(p1[1] + (p2[1] - p0[1]) / 6);
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = clampY(p2[1] - (p3[1] - p1[1]) / 6);
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function ActivityChart({ data, days }: { data: ActivityDayPoint[]; days: number }) {
  const gradientId = useId().replace(/:/g, "");
  const series = buildDays(days, data);
  const max = Math.max(2, ...series.map((d) => d.sessionCount));

  const floor = HEIGHT - PAD_BOTTOM;
  const innerWidth = WIDTH - PAD_X * 2;
  const innerHeight = floor - PAD_TOP;
  const points: [number, number][] = series.map((d, i) => [
    PAD_X + (series.length === 1 ? innerWidth / 2 : (i / (series.length - 1)) * innerWidth),
    floor - (d.sessionCount / max) * innerHeight,
  ]);

  const line = smoothPath(points, floor);
  const area = `${line} L ${points[points.length - 1][0]} ${floor} L ${points[0][0]} ${floor} Z`;
  const hasActivity = series.some((d) => d.sessionCount > 0);
  const mid = series[Math.floor(series.length / 2)];

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Sessions per day">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((fraction) => {
          const y = floor - fraction * innerHeight;
          return (
            <g key={fraction}>
              <line x1={PAD_X} x2={WIDTH - PAD_X} y1={y} y2={y} stroke="#c7d2fe" strokeDasharray="3 4" strokeWidth="1" opacity="0.7" />
              <text x={PAD_X} y={y - 3} fontSize="9" fill="#94a3b8">
                {Math.round(fraction * max)}
              </text>
            </g>
          );
        })}

        {hasActivity && <path d={area} fill={`url(#${gradientId})`} />}
        <path d={line} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {series.map((d, i) =>
          d.sessionCount > 0 ? (
            <circle key={d.date} cx={points[i][0]} cy={points[i][1]} r="4" fill="#fff" stroke="#6366f1" strokeWidth="2">
              <title>{`${shortDate(d.date)}: ${d.sessionCount} session${d.sessionCount === 1 ? "" : "s"}`}</title>
            </circle>
          ) : null
        )}

        <text x={PAD_X} y={HEIGHT - 6} fontSize="10" fill="#64748b">
          {shortDate(series[0].date)}
        </text>
        <text x={WIDTH / 2} y={HEIGHT - 6} fontSize="10" fill="#64748b" textAnchor="middle">
          {shortDate(mid.date)}
        </text>
        <text x={WIDTH - PAD_X} y={HEIGHT - 6} fontSize="10" fill="#64748b" textAnchor="end">
          {shortDate(series[series.length - 1].date)}
        </text>
      </svg>
      {!hasActivity && <p className="-mt-2 text-center text-xs text-slate-400">No completed sessions in this period yet.</p>}
    </div>
  );
}
