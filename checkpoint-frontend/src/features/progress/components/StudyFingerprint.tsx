import { useQuery } from "@tanstack/react-query";
import { getMastery } from "../api/progressApi";
import type { SubjectMastery } from "../types/progress.types";

const SIZE = 260;
const C = SIZE / 2;
const R = 88;

const point = (i: number, n: number, value: number): [number, number] => {
  const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
  return [C + Math.cos(angle) * R * value, C + Math.sin(angle) * R * value];
};
const shorten = (name: string) => (name.length > 13 ? `${name.slice(0, 12)}…` : name);


export function StudyFingerprint() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["progress-mastery"], queryFn: getMastery });

  const tried: SubjectMastery[] = (data?.subjects ?? [])
    .filter((s) => s.answers > 0)
    .sort((a, b) => b.answers - a.answers)
    .slice(0, 8);
  const untouched = (data?.subjects ?? []).filter((s) => s.answers === 0).length;

  return (
    <div className="card p-5">
      <b className="text-sm text-slate-800">Study fingerprint</b>
      {isLoading ? (
        <p className="mt-3 text-sm text-slate-500">Loading...</p>
      ) : isError || !data ? (
        <p className="mt-3 text-sm text-red-600">Could not load your fingerprint.</p>
      ) : tried.length < 3 ? (
        <p className="mt-3 text-sm text-slate-500">
          Practise at least three subjects and your fingerprint takes shape here.
          {tried.length > 0 && ` So far: ${tried.map((s) => s.subjectName).join(", ")}.`}
        </p>
      ) : (
        <div className="mt-2 grid items-center gap-4 sm:grid-cols-[260px_1fr]">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-[260px]" role="img" aria-label="Accuracy by subject">
            {[0.25, 0.5, 0.75, 1].map((ring) => (
              <polygon
                key={ring}
                points={tried.map((_, i) => point(i, tried.length, ring).join(",")).join(" ")}
                fill="none"
                stroke="rgb(var(--line))"
                strokeWidth={1}
              />
            ))}
            {tried.map((_, i) => {
              const [x, y] = point(i, tried.length, 1);
              return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgb(var(--line))" strokeWidth={1} />;
            })}
            <polygon
              points={tried.map((s, i) => point(i, tried.length, Math.max(0.04, s.accuracy / 100)).join(",")).join(" ")}
              fill="#8b6cf0"
              fillOpacity={0.35}
              stroke="#8b6cf0"
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            {tried.map((s, i) => {
              const [x, y] = point(i, tried.length, Math.max(0.04, s.accuracy / 100));
              const [lx, ly] = point(i, tried.length, 1.2);
              return (
                <g key={s.subjectId}>
                  <circle cx={x} cy={y} r={3.5} fill="#8b6cf0" />
                  <text
                    x={lx}
                    y={ly + 3}
                    fontSize={10}
                    fontWeight={700}
                    textAnchor={lx < C - 4 ? "end" : lx > C + 4 ? "start" : "middle"}
                    style={{ fill: "rgb(var(--ink))" }}
                  >
                    {shorten(s.subjectName)}
                  </text>
                </g>
              );
            })}
          </svg>
          <ul className="space-y-1.5 text-sm">
            {[...tried]
              .sort((a, b) => b.accuracy - a.accuracy)
              .map((s) => (
                <li key={s.subjectId} className="flex items-center justify-between gap-3">
                  <span className="truncate font-semibold text-slate-700">{s.subjectName}</span>
                  <span className="shrink-0 text-slate-500">
                    <b className="text-slate-800">{s.accuracy}%</b> · {s.answers} answers
                  </span>
                </li>
              ))}
            {untouched > 0 && (
              <li className="pt-1 text-xs text-slate-500">
                {untouched} {untouched === 1 ? "subject" : "subjects"} not started yet.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
