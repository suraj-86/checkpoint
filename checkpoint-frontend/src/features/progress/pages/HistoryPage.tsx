import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronRight, Search, X } from "lucide-react";
import { inputClass, secondaryButton } from "../../../components/ui/styles";
import { formatDateTime } from "../../../lib/format";
import { getTopics, searchHistory } from "../api/progressApi";
import type { HistoryFilters, SessionHistoryItem } from "../types/progress.types";

const EMPTY: HistoryFilters = {
  q: "",
  type: "",
  status: "",
  topicId: "",
  result: "",
  fromDate: "",
  toDate: "",
  sort: "newest",
};

const STATUS_LABELS: Record<string, { text: string; className: string }> = {
  COMPLETED: { text: "Completed", className: "bg-emerald-100 text-emerald-700" },
  IN_PROGRESS: { text: "In progress", className: "bg-sky-100 text-sky-700" },
  ABANDONED: { text: "Ended early", className: "bg-amber-100 text-amber-700" },
};

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

function Row({ item }: { item: SessionHistoryItem }) {
  const s = item.summary;
  const label = STATUS_LABELS[s.status];
  const answered = s.correctCount + s.wrongCount;
  return (
    <li>
      <Link
        to={s.status === "IN_PROGRESS" ? "/practice/active" : `/progress/sessions/${s.sessionId}`}
        className="group card flex flex-wrap items-center justify-between gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-800">
              {s.sessionType === "DAILY" ? "Daily Session" : "Fast Practice"}
            </span>
            {label && <span className={`rounded-full px-2 py-0.5 text-xs ${label.className}`}>{label.text}</span>}
            <span className="text-xs text-slate-400">{formatDateTime(s.completedAt ?? s.startedAt)}</span>
          </div>
          {item.topics.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {item.topics.map((t) => (
                <span key={t} className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span>
            {s.correctCount}/{item.totalQuestions} correct
            {answered < item.totalQuestions && <span className="text-xs text-slate-400"> ({answered} answered)</span>}
          </span>
          {s.xpChange !== null && (
            <span className={`w-16 text-right font-medium ${s.xpChange >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
              {s.xpChange >= 0 ? "+" : ""}
              {s.xpChange} XP
            </span>
          )}
          <ChevronRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
        </div>
      </Link>
    </li>
  );
}

export function HistoryPage() {
  const [filters, setFilters] = useState<HistoryFilters>(EMPTY);
  const [page, setPage] = useState(0);
  const debouncedText = useDebounced(filters.q, 400);
  const effective = { ...filters, q: debouncedText };

  const { data: topics } = useQuery({ queryKey: ["topics"], queryFn: getTopics });
  const { data, isError, isFetching } = useQuery({
    queryKey: ["history", effective, page],
    queryFn: () => searchHistory(effective, page),
    placeholderData: keepPreviousData,
  });

  function change<K extends keyof HistoryFilters>(key: K, value: HistoryFilters[K]) {
    setPage(0);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  const active = JSON.stringify(filters) !== JSON.stringify(EMPTY);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Session history</h1>
        <p className="text-sm text-slate-500">
          Find any past session, then open it to revise the questions and your answers.
        </p>
      </div>

      <div className="card space-y-3 p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.q}
            onChange={(e) => change("q", e.target.value)}
            placeholder="Search the questions you practised (for example: HashMap, inheritance, join)"
            className={`${inputClass} pl-9`}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select value={filters.topicId} onChange={(e) => change("topicId", e.target.value)} className={inputClass} aria-label="Topic">
            <option value="">All topics</option>
            {topics?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select value={filters.type} onChange={(e) => change("type", e.target.value as HistoryFilters["type"])} className={inputClass} aria-label="Session type">
            <option value="">Daily and Fast</option>
            <option value="DAILY">Daily Session</option>
            <option value="FAST">Fast Practice</option>
          </select>
          <select value={filters.status} onChange={(e) => change("status", e.target.value as HistoryFilters["status"])} className={inputClass} aria-label="Status">
            <option value="">Any status</option>
            <option value="COMPLETED">Completed</option>
            <option value="ABANDONED">Ended early</option>
            <option value="IN_PROGRESS">In progress</option>
          </select>
          <select value={filters.result} onChange={(e) => change("result", e.target.value as HistoryFilters["result"])} className={inputClass} aria-label="Result">
            <option value="">Any result</option>
            <option value="PERFECT">Perfect (no wrong answers)</option>
            <option value="HAS_WRONG">Had wrong answers</option>
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-slate-500">
            From
            <input type="date" value={filters.fromDate} max={filters.toDate || undefined} onChange={(e) => change("fromDate", e.target.value)} className={inputClass} />
          </label>
          <label className="text-xs text-slate-500">
            To
            <input type="date" value={filters.toDate} min={filters.fromDate || undefined} onChange={(e) => change("toDate", e.target.value)} className={inputClass} />
          </label>
          <label className="text-xs text-slate-500">
            Order
            <select value={filters.sort} onChange={(e) => change("sort", e.target.value as HistoryFilters["sort"])} className={inputClass}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
          <div className="flex items-end">
            {active && (
              <button
                type="button"
                onClick={() => {
                  setFilters(EMPTY);
                  setPage(0);
                }}
                className={`${secondaryButton} inline-flex w-full items-center justify-center gap-1.5`}
              >
                <X size={14} /> Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {isError ? (
        <p className="text-red-600">Could not load your history.</p>
      ) : !data ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {data.totalElements} {data.totalElements === 1 ? "session" : "sessions"}
            {active ? " match your filters" : " in total"}
            {isFetching && <span className="ml-2 text-xs text-slate-400">updating...</span>}
          </p>

          {data.content.length === 0 ? (
            <div className="card p-8 text-center text-sm text-slate-500">No sessions match these filters.</div>
          ) : (
            <ul className="space-y-3">
              {data.content.map((item) => (
                <Row key={item.summary.sessionId} item={item} />
              ))}
            </ul>
          )}

          {data.totalPages > 1 && (
            <div className="flex items-center justify-between pb-6 text-sm text-slate-500">
              <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className={secondaryButton}>
                Previous
              </button>
              <span className="flex items-center gap-2">
                Page
                <input
                  type="number"
                  min={1}
                  max={data.totalPages}
                  value={page + 1}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (n >= 1 && n <= data.totalPages) setPage(n - 1);
                  }}
                  className="w-16 rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-center text-sm"
                  aria-label="Page number"
                />
                of {data.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                disabled={page >= data.totalPages - 1}
                className={secondaryButton}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
