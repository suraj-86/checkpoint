import type { ElementType, ReactNode } from "react";

const TONES = {
  indigo: "bg-indigo-100 text-indigo-600",
  amber: "bg-amber-100 text-amber-600",
  rose: "bg-rose-100 text-rose-600",
  emerald: "bg-emerald-100 text-emerald-600",
  sky: "bg-sky-100 text-sky-600",
} as const;

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "indigo",
}: {
  icon: ElementType;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${TONES[tone]}`}>
          <Icon size={18} />
        </div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
