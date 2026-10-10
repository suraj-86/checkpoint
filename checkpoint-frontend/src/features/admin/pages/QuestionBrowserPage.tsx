import { Fragment, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTopics } from "@/features/progress/api/progressApi";
import { restoreQuestion, retireQuestion, searchQuestions } from "../api/adminApi";
import type { AdminQuestion, QuestionFilters } from "../types/admin.types";
import { messageFromError, prettify } from "../utils/format";

const PAGE_SIZE = 20;

const EMPTY_FILTERS: QuestionFilters = { topicId: "", difficulty: "", type: "", active: "" };

const selectClass = "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm";

export function QuestionBrowserPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<QuestionFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: topics } = useQuery({ queryKey: ["topics"], queryFn: getTopics });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-questions", filters, page],
    queryFn: () => searchQuestions(filters, page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  });

  const toggleMutation = useMutation({
    mutationFn: (q: AdminQuestion) => (q.active ? retireQuestion(q.id) : restoreQuestion(q.id)),
    onMutate: () => setActionError(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-datasets"] });
    },
    onError: (err) => setActionError(messageFromError(err)),
  });

  function updateFilter(key: keyof QuestionFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
    setExpandedId(null);
  }

  function handleToggle(q: AdminQuestion) {
    if (q.active && !window.confirm(`Retire ${q.externalId}? Students will no longer see it in new sessions.`)) {
      return;
    }
    toggleMutation.mutate(q);
  }

  const hasFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Question browser</h1>

      <div className="flex flex-wrap items-center gap-3 card p-3">
        <select value={filters.topicId} onChange={(e) => updateFilter("topicId", e.target.value)} className={selectClass}>
          <option value="">All topics</option>
          {topics?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select value={filters.difficulty} onChange={(e) => updateFilter("difficulty", e.target.value)} className={selectClass}>
          <option value="">All difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
          <option value="EXPERT">Expert</option>
        </select>

        <select value={filters.type} onChange={(e) => updateFilter("type", e.target.value)} className={selectClass}>
          <option value="">All types</option>
          <option value="MULTIPLE_CHOICE">Multiple choice</option>
          <option value="TRUE_FALSE">True / false</option>
          <option value="FILL_IN_BLANK">Fill in blank</option>
        </select>

        <select value={filters.active} onChange={(e) => updateFilter("active", e.target.value)} className={selectClass}>
          <option value="">Active and retired</option>
          <option value="true">Active only</option>
          <option value="false">Retired only</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setPage(0);
              setExpandedId(null);
            }}
            className="text-sm text-slate-500 underline hover:text-slate-800"
          >
            Clear filters
          </button>
        )}

        {data && <span className="ml-auto text-sm text-slate-500">{data.totalElements} questions</span>}
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div>
      )}

      {isLoading && <p className="text-sm text-slate-400">Loading...</p>}
      {isError && <p className="text-sm text-red-600">Could not load questions.</p>}

      {data && data.content.length === 0 && (
        <p className="card p-6 text-sm text-slate-500">
          No questions match these filters.
        </p>
      )}

      {data && data.content.length > 0 && (
        <div className="overflow-x-auto card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Topic</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Difficulty</th>
                <th className="px-3 py-2">Question</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((q) => {
                const expanded = expandedId === q.id;
                return (
                  <Fragment key={q.id}>
                    <tr
                      onClick={() => setExpandedId(expanded ? null : q.id)}
                      className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${q.active ? "" : "text-slate-400"}`}
                    >
                      <td className="whitespace-nowrap px-3 py-2 font-medium">{q.externalId}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {q.topic}
                        {q.subtopic ? ` / ${q.subtopic}` : ""}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">{prettify(q.questionType)}</td>
                      <td className="whitespace-nowrap px-3 py-2">{prettify(q.difficulty)}</td>
                      <td className="max-w-xs truncate px-3 py-2">{q.questionText}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            q.active ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {q.active ? "Active" : "Retired"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggle(q);
                          }}
                          disabled={toggleMutation.isPending}
                          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          {q.active ? "Retire" : "Restore"}
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <td colSpan={7} className="px-4 py-3">
                          <QuestionDetail question={q} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-100 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {data.page + 1} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
            disabled={page >= data.totalPages - 1}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-100 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function QuestionDetail({ question }: { question: AdminQuestion }) {
  const data = (question.answerData ?? {}) as Record<string, unknown>;
  const options = Array.isArray(data.options) ? (data.options as string[]) : null;
  const accepted = Array.isArray(data.acceptedAnswers) ? (data.acceptedAnswers as string[]) : null;
  const correct = data.correctAnswer;

  return (
    <div className="space-y-2 text-sm text-slate-700">
      <p>{question.questionText}</p>

      {options && (
        <ul className="space-y-1">
          {options.map((o) => (
            <li key={o} className={o === correct ? "font-medium text-green-700" : ""}>
              {o === correct ? "✓ " : "• "}
              {o}
            </li>
          ))}
        </ul>
      )}

      {!options && correct !== undefined && (
        <p>
          <span className="font-medium">Correct answer:</span> {String(correct)}
        </p>
      )}

      {accepted && (
        <p>
          <span className="font-medium">Accepted answers:</span> {accepted.join(", ")}
        </p>
      )}

      {question.explanation && (
        <p className="text-slate-500">
          <span className="font-medium text-slate-700">Explanation:</span> {question.explanation}
        </p>
      )}
    </div>
  );
}
