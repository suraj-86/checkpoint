import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, CircleDashed, Eye, EyeOff, XCircle } from "lucide-react";
import { secondaryButton } from "../../../components/ui/styles";
import { formatDateTime } from "../../../lib/format";
import { getSessionDetail } from "../api/progressApi";
import type { QuestionReview } from "../types/progress.types";

type Filter = "ALL" | "WRONG" | "CORRECT" | "UNANSWERED";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "WRONG", label: "Wrong" },
  { key: "CORRECT", label: "Correct" },
  { key: "UNANSWERED", label: "Unanswered" },
];

function show(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (Array.isArray(value)) return value.join("  /  ");
  return String(value);
}

function sameAnswer(a: unknown, b: unknown): boolean {
  return typeof a === typeof b && String(a).trim() === String(b).trim();
}

function StatusBadge({ status }: { status: QuestionReview["status"] }) {
  if (status === "CORRECT")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 size={13} /> Correct
      </span>
    );
  if (status === "WRONG")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
        <XCircle size={13} /> Wrong
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      <CircleDashed size={13} /> Not answered
    </span>
  );
}

function OptionRow({ text, review }: { text: string; review: QuestionReview }) {
  const isCorrect = review.correctAnswer !== null && sameAnswer(text, review.correctAnswer);
  const isYours = review.yourAnswer !== null && sameAnswer(text, review.yourAnswer);
  let style = "border-slate-200 bg-white/70 text-slate-700";
  let tag = "";
  if (isCorrect) {
    style = "border-emerald-300 bg-emerald-50 text-emerald-800";
    tag = isYours ? "Your answer, correct" : "Correct answer";
  } else if (isYours) {
    style = "border-rose-300 bg-rose-50 text-rose-800";
    tag = "Your answer";
  }
  return (
    <li className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-2 text-sm ${style}`}>
      <span className="whitespace-pre-wrap break-words font-mono text-[13px]">{text}</span>
      {tag && <span className="shrink-0 text-xs font-medium">{tag}</span>}
    </li>
  );
}

function QuestionCard({ review, revise }: { review: QuestionReview; revise: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const hidden = revise && !revealed;
  const canReveal = review.correctAnswer !== null;

  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">Q{review.number}</span>
          <span>{review.topic}</span>
          {review.subtopic && <span className="text-slate-400">· {review.subtopic}</span>}
          <span className="text-slate-400">· {review.difficulty.toLowerCase()}</span>
        </div>
        {!hidden && <StatusBadge status={review.status} />}
      </div>

      <p className="mt-3 whitespace-pre-wrap break-words text-sm font-medium text-slate-800">{review.question}</p>

      {hidden ? (
        <div className="mt-4">
          {review.options && (
            <ul className="space-y-2">
              {review.options.map((o) => (
                <li key={o} className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 font-mono text-[13px] text-slate-700 whitespace-pre-wrap">
                  {o}
                </li>
              ))}
            </ul>
          )}
          {canReveal ? (
            <button type="button" onClick={() => setRevealed(true)} className={`${secondaryButton} mt-3 inline-flex items-center gap-2`}>
              <Eye size={15} /> Show answer
            </button>
          ) : (
            <p className="mt-3 text-xs text-slate-400">The answer is hidden until you finish this session.</p>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {review.type === "MCQ" && review.options ? (
            <ul className="space-y-2">
              {review.options.map((o) => (
                <OptionRow key={o} text={o} review={review} />
              ))}
            </ul>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm">
                <p className="text-xs text-slate-500">Your answer</p>
                <p className={review.status === "WRONG" ? "font-medium text-rose-700" : "font-medium text-emerald-700"}>
                  {review.status === "UNANSWERED" ? "Not answered" : show(review.yourAnswer)}
                </p>
              </div>
              {review.correctAnswer !== null && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                  <p className="text-xs text-emerald-700">Correct answer</p>
                  <p className="font-medium text-emerald-800">{show(review.correctAnswer)}</p>
                </div>
              )}
            </div>
          )}

          {review.status === "UNANSWERED" && review.type === "MCQ" && (
            <p className="text-xs text-slate-500">You did not answer this one.</p>
          )}

          {review.explanation && (
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <span className="font-medium text-slate-800">Why: </span>
              <span className="whitespace-pre-wrap">{review.explanation}</span>
            </div>
          )}

          {revise && (
            <button type="button" onClick={() => setRevealed(false)} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
              <EyeOff size={13} /> Hide again
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [revise, setRevise] = useState(false);

  const { data, isError, isLoading } = useQuery({
    queryKey: ["session-detail", sessionId],
    queryFn: () => getSessionDetail(sessionId!),
    enabled: !!sessionId,
  });

  const counts = useMemo(() => {
    const c = { ALL: 0, WRONG: 0, CORRECT: 0, UNANSWERED: 0 } as Record<Filter, number>;
    data?.questions.forEach((q) => {
      c.ALL++;
      c[q.status]++;
    });
    return c;
  }, [data]);

  if (isLoading) return <p className="text-slate-500">Loading...</p>;
  if (isError || !data) {
    return (
      <div className="space-y-3">
        <p className="text-red-600">Could not load this session.</p>
        <Link to="/progress" className="text-sm text-indigo-600 underline">Back to progress</Link>
      </div>
    );
  }

  const s = data.summary;
  const visible = data.questions.filter((q) => filter === "ALL" || q.status === filter);
  const answered = s.correctCount + s.wrongCount;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/progress" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back to progress
      </Link>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">
              {s.sessionType === "DAILY" ? "Daily Session" : "Fast Practice"}
            </h1>
            <p className="text-sm text-slate-500">
              {formatDateTime(s.completedAt ?? s.startedAt)}
              {s.status === "ABANDONED" && " · ended early"}
              {s.status === "IN_PROGRESS" && " · in progress"}
            </p>
          </div>
          <button type="button" onClick={() => setRevise((r) => !r)} className={`${secondaryButton} inline-flex items-center gap-2`}>
            {revise ? <EyeOff size={15} /> : <Eye size={15} />}
            {revise ? "Exit revise mode" : "Revise mode"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Correct</p>
            <p className="text-lg font-semibold text-slate-800">{s.correctCount} / {data.totalQuestions}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Answered</p>
            <p className="text-lg font-semibold text-slate-800">{answered}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Accuracy</p>
            <p className="text-lg font-semibold text-slate-800">{s.accuracy != null ? `${s.accuracy}%` : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">XP</p>
            <p className={`text-lg font-semibold ${(s.xpChange ?? 0) >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
              {s.xpChange === null ? "—" : `${s.xpChange >= 0 ? "+" : ""}${s.xpChange}`}
            </p>
          </div>
        </div>
      </div>

      {revise && (
        <p className="rounded-xl bg-indigo-50 px-4 py-2 text-sm text-indigo-700">
          Revise mode: answers are hidden. Think first, then press Show answer.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-sm transition ${
              filter === f.key ? "bg-indigo-600 text-white shadow" : "bg-white/80 text-slate-600 hover:bg-white"
            }`}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-slate-400">No questions in this filter.</p>
      ) : (
        <ul className="space-y-4">
          {visible.map((q) => (
            <QuestionCard key={`${q.questionId}-${revise}`} review={q} revise={revise} />
          ))}
        </ul>
      )}

      <div className="pb-6 text-center">
        <Link to="/practice" className="text-sm font-medium text-indigo-600 underline">Practise more</Link>
      </div>
    </div>
  );
}
