import { useId } from "react";
import type { ActivityDayPoint } from "../types/progress.types";
import { buildDays, shortDate, smoothPath } from "./chartUtils";

const WIDTH = 600;
const HEIGHT = 170;
const PAD_X = 10;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;

export function XpTrendChart({
  data,
  days,
  currentXp,
}: {
  data: ActivityDayPoint[];
  days: number;
  currentXp: number;
}) {
  const gradientId = useId().replace(/:/g, "");
  const series = buildDays(days, data);

  const totals: number[] = new Array(series.length);
  let running = currentXp;
  for (let i = series.length - 1; i >= 0; i--) {
    totals[i] = Math.max(0, running);
    running -= series[i].xpTotal;
  }

  const min = Math.min(...totals);
  const max = Math.max(...totals);
  const span = Math.max(1, max - min);
  const floor = HEIGHT - PAD_BOTTOM;
  const innerWidth = WIDTH - PAD_X * 2;
  const innerHeight = floor - PAD_TOP;
  const points: [number, number][] = totals.map((t, i) => [
    PAD_X + (series.length === 1 ? innerWidth / 2 : (i / (series.length - 1)) * innerWidth),
    floor - ((t - min) / span) * innerHeight * 0.9 - 4,
  ]);

  const line = smoothPath(points, floor);
  const area = `${line} L ${points[points.length - 1][0]} ${floor} L ${points[0][0]} ${floor} Z`;
  const gained = totals[totals.length - 1] - totals[0];

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="XP over time">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <line key={f} x1={PAD_X} x2={WIDTH - PAD_X} y1={floor - f * innerHeight} y2={floor - f * innerHeight}
            stroke="#ddd6fe" strokeDasharray="3 4" opacity="0.7" />
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {series.map((d, i) =>
          d.xpTotal !== 0 ? (
            <circle key={d.date} cx={points[i][0]} cy={points[i][1]} r="4" fill="#fff" stroke="#8b5cf6" strokeWidth="2">
              <title>{`${shortDate(d.date)}: ${d.xpTotal > 0 ? "+" : ""}${d.xpTotal} XP (total ${totals[i]})`}</title>
            </circle>
          ) : null
        )}
        <text x={PAD_X} y={HEIGHT - 6} fontSize="10" fill="#64748b">{shortDate(series[0].date)}</text>
        <text x={WIDTH - PAD_X} y={HEIGHT - 6} fontSize="10" fill="#64748b" textAnchor="end">
          {shortDate(series[series.length - 1].date)}
        </text>
      </svg>
      <p className="-mt-1 text-center text-xs text-slate-500">
        {gained === 0 ? "No XP change in this period." : `${gained > 0 ? "+" : ""}${gained} XP over this period`}
      </p>
    </div>
  );
}
