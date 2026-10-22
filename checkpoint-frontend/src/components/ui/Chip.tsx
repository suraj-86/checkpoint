import type { ReactNode } from "react";

export type ChipTone = "neutral" | "good" | "warn" | "bad" | "pri";

const TONES: Record<ChipTone, string> = {
  neutral: "border-slate-300 bg-slate-100 text-slate-700",
  good: "border-emerald-400 bg-emerald-100 text-emerald-800",
  warn: "border-amber-400 bg-amber-100 text-amber-800",
  bad: "border-rose-400 bg-rose-100 text-rose-800",
  pri: "border-indigo-300 bg-indigo-100 text-indigo-700",
};

export function Chip({ tone = "neutral", children }: { tone?: ChipTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-xs font-bold ${TONES[tone]}`}>
      {children}
    </span>
  );
}
