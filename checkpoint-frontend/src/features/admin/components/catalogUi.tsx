import { useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { inputClass } from "@/components/ui/styles";

export function Badge({ children, tone }: { children: ReactNode; tone: "indigo" | "violet" | "slate" | "amber" | "emerald" }) {
  const styles = {
    indigo: "bg-indigo-50 text-indigo-700",
    violet: "bg-violet-50 text-violet-700",
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[tone]}`}>{children}</span>;
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-[14rem] flex-1">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        aria-label={placeholder}
        className={`${inputClass} pl-9 pr-8`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function SelectFilter({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
  allLabel: string;
}) {
  return (
    <select aria-label={label} className={`${inputClass} w-auto max-w-[14rem]`} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}

export const STATE_OPTIONS = [
  { id: "active", name: "Active only" },
  { id: "retired", name: "Retired only" },
];

export function ChipPicker({
  label,
  items,
  selected,
  onChange,
  emptyText,
}: {
  label: string;
  items: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  emptyText: string;
}) {
  const [query, setQuery] = useState("");
  const shown = items.filter((i) => selected.includes(i.id) || i.name.toLowerCase().includes(query.trim().toLowerCase()));

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-700">
        {label} <span className="font-normal text-slate-400">({selected.length} selected)</span>
      </legend>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">{emptyText}</p>
      ) : (
        <>
          {items.length > 8 && <input aria-label={`Search ${label}`} className={inputClass} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." />}
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
            {shown.map((item) => (
              <label
                key={item.id}
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
                  selected.includes(item.id)
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white/70 text-slate-600 hover:bg-white"
                }`}
              >
                <input type="checkbox" className="accent-indigo-600" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} />
                {item.name}
              </label>
            ))}
            {shown.length === 0 && <p className="text-xs text-slate-400">Nothing matches.</p>}
          </div>
        </>
      )}
    </fieldset>
  );
}

export function matches(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase());
}
