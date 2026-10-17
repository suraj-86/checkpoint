import type { SlotInfo, SlotStatus } from "../types/practice.types";

const STYLE: Record<SlotStatus, string> = {
  CORRECT: "bg-emerald-500 text-white hover:bg-emerald-600",
  WRONG: "bg-rose-500 text-white hover:bg-rose-600",
  SKIPPED: "bg-amber-400 text-white hover:bg-amber-500",
  NOT_ATTEMPTED: "bg-slate-100 text-slate-600 hover:bg-slate-200",
};

const LEGEND: { status: SlotStatus; label: string }[] = [
  { status: "CORRECT", label: "Correct" },
  { status: "WRONG", label: "Wrong" },
  { status: "SKIPPED", label: "Skipped" },
  { status: "NOT_ATTEMPTED", label: "Not attempted" },
];

interface Props {
  slots: SlotInfo[];
  current: number;
  onSelect: (position: number) => void;
}

export function QuestionPalette({ slots, current, onSelect }: Props) {
  let retryNumber = 0;
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {slots.map((slot) => {
          const label = slot.primary ? String(slot.position) : `R${++retryNumber}`;
          const isCurrent = slot.position === current;
          return (
            <button
              key={slot.position}
              type="button"
              onClick={() => onSelect(slot.position)}
              aria-label={`Question ${label}, ${slot.status.replace("_", " ").toLowerCase()}`}
              aria-current={isCurrent ? "true" : undefined}
              className={`h-10 rounded-xl text-sm font-semibold transition active:scale-95 ${STYLE[slot.status]} ${
                isCurrent ? "scale-105 ring-2 ring-indigo-500 ring-offset-2" : ""
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-500">
        {LEGEND.map(({ status, label }) => (
          <li key={status} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded ${STYLE[status].split(" ")[0]}`} />
            {slots.filter((s) => s.status === status).length} {label.toLowerCase()}
          </li>
        ))}
      </ul>
      {slots.some((s) => !s.primary) && (
        <p className="mt-2 text-xs text-slate-400">R = a retry of a question you got wrong.</p>
      )}
    </div>
  );
}
