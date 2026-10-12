import type { ActivityDayPoint } from "../types/progress.types";

export interface Day {
  date: string;
  sessionCount: number;
  xpTotal: number;
}

export function buildDays(days: number, data: ActivityDayPoint[]): Day[] {
  const byDate = new Map(data.map((d) => [d.date, d]));
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: days }, (_, k) => {
    const date = new Date(todayUtc - (days - 1 - k) * 86_400_000).toISOString().slice(0, 10);
    const point = byDate.get(date);
    return { date, sessionCount: point?.sessionCount ?? 0, xpTotal: point?.xpTotal ?? 0 };
  });
}

export function smoothPath(points: [number, number][], floor: number): string {
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

export function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
