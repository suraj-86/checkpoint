import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CheckCircle2, SkipForward, XCircle } from "lucide-react";
import { messageFromError } from "../../admin/utils/format";
import { secondaryButton } from "../../../components/ui/styles";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { abandonSession, getOverview, getSlot, skipSlot, submitAnswer } from "../api/practiceApi";
import { QuestionPalette } from "../components/QuestionPalette";
import type { SlotQuestion } from "../types/practice.types";

function show(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (Array.isArray(value)) return value.join("  /  ");
  return String(value);
}

function same(a: unknown, b: unknown): boolean {
  return typeof a === typeof b && String(a).trim() === String(b).trim();
}

function ReviewOptions({ slot }: { slot: SlotQuestion }) {
  const review = slot.review!;
  const q = slot.question;

  if (q.type === "MCQ" && q.options) {
    return (
      <ul className="mt-4 space-y-2">
        {q.options.map((o) => {
          const isCorrect = same(o, review.correctAnswer);
          const isYours = same(o, review.yourAnswer);
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
            <li key={o} className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm ${style}`}>
              <span className="whitespace-pre-wrap break-words">{o}</span>
              {tag && <span className="shrink-0 text-xs font-medium">{tag}</span>}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm">
        <p className="text-xs text-slate-500">Your answer</p>
        <p className={review.correct ? "font-medium text-emerald-700" : "font-medium text-rose-700"}>{show(review.yourAnswer)}</p>
      </div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
        <p className="text-xs text-emerald-700">Correct answer</p>
        <p className="font-medium text-emerald-800">{show(review.correctAnswer)}</p>
      </div>
    </div>
  );
}

export function PracticeSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [position, setPosition] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [dialog, setDialog] = useState<"none" | "submit" | "end" | "daily-empty">("none");

  const { data: overview, isError: overviewError } = useQuery({
    queryKey: ["session-overview", sessionId],
    queryFn: () => getOverview(sessionId!),
    enabled: !!sessionId && !leaving,
    retry: false,
  });

  useEffect(() => {
    if (overview && position === null) setPosition(overview.currentPosition);
  }, [overview, position]);

  const { data: slot, isLoading: slotLoading } = useQuery({
    queryKey: ["session-slot", sessionId, position],
    queryFn: () => getSlot(sessionId!, position!),
    enabled: !!sessionId && position !== null && !leaving,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["session-overview", sessionId] });
    queryClient.invalidateQueries({ queryKey: ["session-slot", sessionId] });
    queryClient.invalidateQueries({ queryKey: ["active-session"] });
  }

  function goTo(next: number) {
    setTextAnswer("");
    setPosition(next);
  }

  const total = overview?.slots.length ?? 0;
  const slots = overview?.slots ?? [];
  const primarySlots = slots.filter((s) => s.primary);
  const answeredPrimary = primarySlots.filter((s) => s.status === "CORRECT" || s.status === "WRONG").length;
  const unattempted = primarySlots.length - answeredPrimary;
  const allDone = overview !== undefined && slots.every((s) => s.status === "CORRECT" || s.status === "WRONG");
  const isDaily = overview?.sessionType === "DAILY";

  function nextUnanswered(from: number): number | null {
    for (let step = 1; step <= total; step++) {
      const candidate = ((from - 1 + step) % total) + 1;
      const status = slots[candidate - 1]?.status;
      if (status === "NOT_ATTEMPTED" || status === "SKIPPED") return candidate;
    }
    return null;
  }

  const answerMutation = useMutation({
    mutationFn: (answer: string | boolean) => {
      if (!sessionId || !slot) throw new Error("No question");
      return submitAnswer(sessionId, { questionId: slot.question.id, answer });
    },
    onSuccess: refresh,
  });

  const skipMutation = useMutation({
    mutationFn: () => skipSlot(sessionId!, position!),
    onSuccess: (updated) => {
      queryClient.setQueryData(["session-overview", sessionId], updated);
      queryClient.invalidateQueries({ queryKey: ["session-slot", sessionId] });
      if (position !== null && position < updated.slots.length) goTo(position + 1);
    },
  });

  const abandonMutation = useMutation({
    mutationFn: () => abandonSession(sessionId!),
    onMutate: () => setLeaving(true),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["active-session"] });
      queryClient.removeQueries({ queryKey: ["session-overview", sessionId] });
      navigate("/dashboard");
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] !== "active-session" });
    },
    onError: () => setLeaving(false),
  });

  function handleSubmit() {
    if (!overview) return;
    if (answeredPrimary === 0) setDialog(isDaily ? "daily-empty" : "end");
    else setDialog("submit");
  }

  function confirmSubmit() {
    setDialog("none");
    setLeaving(true);
    queryClient.removeQueries({ queryKey: ["session-overview", sessionId] });
    navigate(`/practice/result/${sessionId}`);
  }

  function confirmEnd() {
    setDialog("none");
    abandonMutation.mutate();
  }

  if (overviewError) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-red-600">This session is not available any more.</p>
        <button type="button" onClick={() => navigate("/dashboard")} className="mt-3 text-sm text-slate-600 underline">
          Back to dashboard
        </button>
      </div>
    );
  }

  if (!overview || position === null) return <p className="text-slate-500">Loading session...</p>;

  const q = slot?.question;
  const answered = slot?.review != null;
  const busy = answerMutation.isPending || skipMutation.isPending || abandonMutation.isPending;
  const progressPct = total === 0 ? 0 : (slots.filter((s) => s.status === "CORRECT" || s.status === "WRONG").length / total) * 100;
  const retryLabel = slot && !slot.primary ? " (retry)" : "";
  const submitLabel = !isDaily && answeredPrimary === 0 ? "End session" : "Submit session";

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_300px]">
      <div>
        <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
          <span className="font-medium text-slate-700">
            Question {position} of {total}
            {retryLabel}
          </span>
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              {isDaily ? "Daily Session" : "Fast Practice"}
            </span>
            {q && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {q.difficulty.toLowerCase()}
              </span>
            )}
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all" style={{ width: `${progressPct}%` }} />
        </div>

        {allDone && (
          <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            You have answered every question. Look back at any of them from the palette, or submit when you are ready.
          </div>
        )}

        <div className="card mt-4 p-6" key={position}>
          {slotLoading || !slot || !q ? (
            <p className="text-slate-500">Loading question...</p>
          ) : (
            <>
              {slot.status === "SKIPPED" && (
                <p className="mb-2 text-xs font-medium text-amber-600">You skipped this question earlier.</p>
              )}
              <p className="whitespace-pre-wrap break-words text-lg font-medium text-slate-800">{q.question}</p>

              {!answered && q.type === "MCQ" && q.options && (
                <div className="mt-4 space-y-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => answerMutation.mutate(opt)}
                      disabled={busy}
                      className="block w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-left text-sm transition hover:border-indigo-300 hover:bg-indigo-50/60 disabled:opacity-50"
                    >
                      <span className="whitespace-pre-wrap break-words">{opt}</span>
                    </button>
                  ))}
                </div>
              )}

              {!answered && q.type === "TRUE_FALSE" && (
                <div className="mt-4 flex gap-3">
                  {[true, false].map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => answerMutation.mutate(value)}
                      disabled={busy}
                      className="flex-1 rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-medium transition hover:border-indigo-300 hover:bg-indigo-50/60 disabled:opacity-50"
                    >
                      {value ? "True" : "False"}
                    </button>
                  ))}
                </div>
              )}

              {!answered && q.type === "FILL_IN_BLANK" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (textAnswer.trim()) answerMutation.mutate(textAnswer.trim());
                  }}
                  className="mt-4"
                >
                  <input
                    type="text"
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="Type your answer"
                    autoFocus
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="submit"
                    disabled={busy || !textAnswer.trim()}
                    className="mt-3 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-200 disabled:opacity-50"
                  >
                    Submit answer
                  </button>
                </form>
              )}

              {answered && slot.review && (
                <div className="mt-2 space-y-3">
                  <div
                    className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                      slot.review.correct ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {slot.review.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    {slot.review.correct ? "Correct!" : "Not quite."}
                    {!slot.review.correct && slot.primary && (
                      <span className="text-xs font-normal">(you will get one retry at the end)</span>
                    )}
                  </div>
                  <ReviewOptions slot={slot} />
                  {slot.review.explanation && (
                    <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{slot.review.explanation}</p>
                  )}
                  {nextUnanswered(position) !== null && (
                    <button
                      type="button"
                      onClick={() => goTo(nextUnanswered(position)!)}
                      className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-200"
                    >
                      Continue to the next open question
                    </button>
                  )}
                </div>
              )}

              {(answerMutation.isError || skipMutation.isError) && (
                <p className="mt-3 text-sm text-red-600">{messageFromError(answerMutation.error ?? skipMutation.error)}</p>
              )}
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={() => goTo(position - 1)} disabled={position <= 1 || busy} className={`${secondaryButton} inline-flex items-center gap-1.5`}>
            <ArrowLeft size={15} /> Previous
          </button>
          <button
            type="button"
            onClick={() => skipMutation.mutate()}
            disabled={answered || busy}
            className={`${secondaryButton} inline-flex items-center gap-1.5 border-amber-200 text-amber-700`}
          >
            <SkipForward size={15} /> Skip this question
          </button>
          <button type="button" onClick={() => goTo(position + 1)} disabled={position >= total || busy} className={`${secondaryButton} inline-flex items-center gap-1.5`}>
            Next <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="card p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Questions</h2>
            <span className="text-xs text-slate-500">
              {answeredPrimary}/{primarySlots.length} answered
            </span>
          </div>
          <QuestionPalette slots={slots} current={position} onSelect={goTo} />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
          >
            {submitLabel}
          </button>
          <p className="mt-2 text-xs text-slate-400">
            {isDaily
              ? "Unattempted questions count against your accuracy and XP."
              : "Unanswered questions are saved and come back in later sessions."}
          </p>
          {abandonMutation.isError && <p className="mt-2 text-xs text-red-600">Could not end the session. Try again.</p>}
        </div>
      </aside>

      <ConfirmDialog
        open={dialog === "submit"}
        title="Submit this session?"
        tone={unattempted > 0 ? "warning" : "primary"}
        confirmLabel="Submit session"
        cancelLabel="Keep practising"
        onConfirm={confirmSubmit}
        onCancel={() => setDialog("none")}
      >
        <p>
          You answered <b className="text-slate-800">{answeredPrimary}</b> of <b className="text-slate-800">{primarySlots.length}</b> questions.
        </p>
        {unattempted > 0 && isDaily && (
          <p>
            The {unattempted} unattempted question{unattempted === 1 ? "" : "s"} will count against you: accuracy and XP are
            calculated out of {primarySlots.length}.
          </p>
        )}
        {unattempted > 0 && !isDaily && (
          <p>
            Only your answered questions are scored. The {unattempted} unanswered question{unattempted === 1 ? "" : "s"} will be
            saved and offered again in your next sessions.
          </p>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === "end"}
        title="End this session?"
        tone="warning"
        confirmLabel="End session"
        cancelLabel="Keep practising"
        onConfirm={confirmEnd}
        onCancel={() => setDialog("none")}
      >
        <p>You have not answered anything, so this session earns no XP.</p>
        <p>The questions will be offered again in your next sessions.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === "daily-empty"}
        title="Answer a question first"
        tone="info"
        onCancel={() => setDialog("none")}
      >
        <p>Answer at least one question before submitting your Daily Session.</p>
      </ConfirmDialog>
    </div>
  );
}
