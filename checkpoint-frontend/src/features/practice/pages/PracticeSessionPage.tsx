import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Flame, SkipForward, XCircle } from "lucide-react";
import { messageFromError } from "../../admin/utils/format";
import { secondaryButton, primaryButton } from "../../../components/ui/styles";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Chip } from "../../../components/ui/Chip";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { Mascot, MASCOT_LINES, type MascotMood } from "../../../components/mascot/Mascot";
import { useEquippedSkin } from "../../rewards/hooks/useRewards";
import { abandonSession, getOverview, getSlot, skipSlot, submitAnswer } from "../api/practiceApi";
import { QuestionPalette } from "../components/QuestionPalette";
import { playSound } from "../../../lib/sound";
import type { Confidence, SlotQuestion } from "../types/practice.types";

const CONFIDENCE_KEY = "checkpoint_confidence";
const CONFIDENCE_CHOICES: { value: Confidence; label: string }[] = [
  { value: "GUESS", label: "Guessing" },
  { value: "UNSURE", label: "Not sure" },
  { value: "SURE", label: "Sure" },
];

function readAskConfidence(): boolean {
  try {
    return localStorage.getItem(CONFIDENCE_KEY) === "1";
  } catch {
    return false;
  }
}

function show(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (Array.isArray(value)) return value.join("  /  ");
  return String(value);
}

function same(a: unknown, b: unknown): boolean {
  return typeof a === typeof b && String(a).trim() === String(b).trim();
}

function clock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
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
          let style = "border-slate-300 bg-white/70 text-slate-700";
          let tag = "";
          if (isCorrect) {
            style = "border-emerald-500 bg-emerald-500/15 text-slate-800";
            tag = isYours ? "Your answer, correct" : "Correct answer";
          } else if (isYours) {
            style = "border-rose-500 bg-rose-500/15 text-slate-800";
            tag = "Your answer";
          }
          return (
            <li key={o} className={`flex items-start justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-semibold ${style}`}>
              <span className="whitespace-pre-wrap break-words">{o}</span>
              {tag && <span className="shrink-0 text-xs font-extrabold">{tag}</span>}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <div className={`rounded-2xl border-2 px-3 py-2 text-sm ${review.correct ? "border-emerald-500 bg-emerald-500/15" : "border-rose-500 bg-rose-500/15"}`}>
        <p className="text-xs font-bold text-slate-500">Your answer</p>
        <p className="font-extrabold text-slate-800">{show(review.yourAnswer)}</p>
      </div>
      <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-500/15 px-3 py-2 text-sm">
        <p className="text-xs font-bold text-slate-500">Correct answer</p>
        <p className="font-extrabold text-slate-800">{show(review.correctAnswer)}</p>
      </div>
    </div>
  );
}

export function PracticeSessionPage() {
  const skin = useEquippedSkin();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [position, setPosition] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [dialog, setDialog] = useState<"none" | "submit" | "end" | "daily-empty">("none");
  const [askConfidence, setAskConfidence] = useState<boolean>(readAskConfidence);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const startedAt = useRef(Date.now());

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

  const questionId = slot?.question.id;
  const answered = slot?.review != null;

  // The clock for a question starts when it appears and stops once it is answered.
  useEffect(() => {
    startedAt.current = Date.now();
    setNow(Date.now());
    setConfidence(null);
  }, [questionId]);

  useEffect(() => {
    if (!questionId || answered) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [questionId, answered]);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["session-overview", sessionId] });
    queryClient.invalidateQueries({ queryKey: ["session-slot", sessionId] });
    queryClient.invalidateQueries({ queryKey: ["active-session"] });
  }

  function goTo(next: number) {
    setTextAnswer("");
    setPosition(next);
  }

  function toggleConfidence() {
    const next = !askConfidence;
    setAskConfidence(next);
    if (!next) setConfidence(null);
    try {
      localStorage.setItem(CONFIDENCE_KEY, next ? "1" : "0");
    } catch {
      /* storage unavailable: the choice just lasts for this page view */
    }
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
      const seconds = Math.min(86_400, Math.max(0, Math.round((Date.now() - startedAt.current) / 1000)));
      return submitAnswer(sessionId, {
        questionId: slot.question.id,
        answer,
        confidence: askConfidence ? confidence : null,
        timeTakenSeconds: seconds,
      });
    },
    onSuccess: (result) => {
      playSound(result.correct ? "correct" : "wrong");
      if (result.correct) {
        setCombo((c) => {
          const next = c + 1;
          setBestCombo((b) => Math.max(b, next));
          return next;
        });
        setLastResult("correct");
      } else {
        setCombo(0);
        setLastResult("wrong");
      }
      refresh();
    },
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
      navigate("/home");
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

  const busy = answerMutation.isPending || skipMutation.isPending || abandonMutation.isPending;

  // Keyboard: 1-4 answer, S skip, Enter or N continue, arrows move between questions.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || dialog !== "none" || busy || !slot || position === null) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const q = slot.question;
      const key = e.key.toLowerCase();

      if (!answered) {
        if (q.type === "MCQ" && q.options && /^[1-9]$/.test(key)) {
          const option = q.options[Number(key) - 1];
          if (option !== undefined) {
            e.preventDefault();
            answerMutation.mutate(option);
          }
          return;
        }
        if (q.type === "TRUE_FALSE" && (key === "1" || key === "2" || key === "t" || key === "f")) {
          e.preventDefault();
          answerMutation.mutate(key === "1" || key === "t");
          return;
        }
        if (key === "s") {
          e.preventDefault();
          skipMutation.mutate();
          return;
        }
      } else if (key === "enter" || key === "n") {
        const next = nextUnanswered(position);
        if (next !== null) {
          e.preventDefault();
          goTo(next);
          return;
        }
      }
      if (key === "arrowright" && position < total) goTo(position + 1);
      if (key === "arrowleft" && position > 1) goTo(position - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (overviewError) {
    return (
      <div className="mx-auto max-w-md card p-6 text-center">
        <p className="font-bold text-red-600">This session is not available any more.</p>
        <button type="button" onClick={() => navigate("/home")} className={`${secondaryButton} mt-3`}>
          Back to dashboard
        </button>
      </div>
    );
  }

  if (!overview || position === null) return <p className="text-slate-500">Loading session...</p>;

  const q = slot?.question;
  const progressPct = total === 0 ? 0 : (slots.filter((s) => s.status === "CORRECT" || s.status === "WRONG").length / total) * 100;
  const retryLabel = slot && !slot.primary ? " (retry)" : "";
  const submitLabel = !isDaily && answeredPrimary === 0 ? "End session" : "Submit session";
  const elapsed = Math.max(0, Math.round((now - startedAt.current) / 1000));

  const mood: MascotMood = lastResult === "wrong" ? "oops" : combo >= 3 ? "hype" : lastResult === "correct" ? "happy" : "idle";
  const mascotLine = combo >= 3 ? MASCOT_LINES.hype : lastResult === "wrong" ? MASCOT_LINES.oops : lastResult === "correct" ? MASCOT_LINES.happy : "Take your time. You've got this.";

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="font-display text-xl font-bold text-slate-800">
            Question {position} of {total}
            {retryLabel}
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <Chip tone="pri">{isDaily ? "Daily Session" : "Fast Practice"}</Chip>
            {q && <Chip>{q.difficulty.toLowerCase()}</Chip>}
            {combo >= 2 && (
              <Chip tone="warn">
                <Flame size={12} /> Combo x{combo}
              </Chip>
            )}
            <Chip>
              <Clock size={12} /> {answered ? "answered" : clock(elapsed)}
            </Chip>
          </span>
        </div>

        <ProgressBar value={progressPct} label="Session progress" />

        {allDone && (
          <div className="mt-4 rounded-2xl border-2 border-emerald-500 bg-emerald-500/15 px-4 py-3 text-sm font-bold text-slate-800">
            You have answered every question. Look back at any of them from the palette, or submit when you are ready.
          </div>
        )}

        <div className="card mt-4 p-6" key={position}>
          {slotLoading || !slot || !q ? (
            <p className="text-slate-500">Loading question...</p>
          ) : (
            <>
              {slot.status === "SKIPPED" && (
                <p className="mb-2 text-xs font-extrabold text-amber-600">You skipped this question earlier.</p>
              )}
              <p className="whitespace-pre-wrap break-words font-display text-xl font-bold leading-snug text-slate-800">{q.question}</p>

              {!answered && askConfidence && (
                <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="How sure are you?">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">How sure are you?</span>
                  {CONFIDENCE_CHOICES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      aria-pressed={confidence === c.value}
                      onClick={() => setConfidence((cur) => (cur === c.value ? null : c.value))}
                      className={`rounded-full border-2 px-3 py-1 text-xs font-bold transition ${
                        confidence === c.value
                          ? "border-indigo-600 bg-indigo-500 text-white"
                          : "border-slate-300 bg-slate-100 text-slate-600 hover:border-indigo-400"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}

              {!answered && q.type === "MCQ" && q.options && (
                <div className="mt-4 space-y-2">
                  {q.options.map((opt, i) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => answerMutation.mutate(opt)}
                      disabled={busy}
                      className="flex w-full items-start gap-3 rounded-2xl border-2 border-slate-300 bg-white/70 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-50"
                    >
                      <span className="kbd mt-0.5 shrink-0">{i + 1}</span>
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
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-slate-300 bg-white/70 px-4 py-3 text-sm font-extrabold text-slate-800 transition hover:-translate-y-0.5 hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-50"
                    >
                      <span className="kbd">{value ? 1 : 2}</span>
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
                    className="w-full rounded-2xl border-2 border-slate-300 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                  />
                  <button type="submit" disabled={busy || !textAnswer.trim()} className={`${primaryButton} mt-3 w-full`}>
                    Submit answer
                  </button>
                </form>
              )}

              {answered && slot.review && (
                <div className="mt-2 space-y-3">
                  <div
                    className={`mt-3 flex flex-wrap items-center gap-2 rounded-2xl border-2 px-3 py-2 text-sm font-extrabold text-slate-800 ${
                      slot.review.correct ? "border-emerald-500 bg-emerald-500/15" : "border-rose-500 bg-rose-500/15"
                    }`}
                  >
                    {slot.review.correct ? <CheckCircle2 size={18} className="text-emerald-600" /> : <XCircle size={18} className="text-rose-600" />}
                    {slot.review.correct ? "Correct!" : "Not quite."}
                    {!slot.review.correct && slot.primary && (
                      <span className="text-xs font-semibold text-slate-500">(you will get one retry at the end)</span>
                    )}
                  </div>
                  <ReviewOptions slot={slot} />
                  {slot.review.explanation && (
                    <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">{slot.review.explanation}</p>
                  )}
                  {nextUnanswered(position) !== null && (
                    <button type="button" onClick={() => goTo(nextUnanswered(position)!)} className={`${primaryButton} w-full`}>
                      Continue to the next open question <span className="kbd !text-slate-700">Enter</span>
                    </button>
                  )}
                </div>
              )}

              {(answerMutation.isError || skipMutation.isError) && (
                <p className="mt-3 text-sm font-bold text-red-600">{messageFromError(answerMutation.error ?? skipMutation.error)}</p>
              )}
            </>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={() => goTo(position - 1)} disabled={position <= 1 || busy} className={`${secondaryButton} inline-flex items-center gap-1.5`}>
            <ArrowLeft size={15} /> Previous
          </button>
          <button
            type="button"
            onClick={() => skipMutation.mutate()}
            disabled={answered || busy}
            className={`${secondaryButton} inline-flex items-center gap-1.5`}
          >
            <SkipForward size={15} /> Skip <span className="kbd">S</span>
          </button>
          <button type="button" onClick={() => goTo(position + 1)} disabled={position >= total || busy} className={`${secondaryButton} inline-flex items-center gap-1.5`}>
            Next <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <aside className="grid content-start gap-4 lg:sticky lg:top-6 lg:self-start">
        <div className="card flex items-center gap-3 p-4">
          <Mascot skin={skin} mood={mood} size={64} className="shrink-0" />
          <div className="min-w-0 text-sm">
            <p className="font-bold text-slate-800">{mascotLine}</p>
            {bestCombo >= 2 && <p className="mt-0.5 text-xs text-slate-500">Best combo this session: x{bestCombo}</p>}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-bold text-slate-800">Questions</h2>
            <span className="text-xs font-bold text-slate-500">
              {answeredPrimary}/{primarySlots.length} answered
            </span>
          </div>
          <QuestionPalette slots={slots} current={position} onSelect={goTo} />

          <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
            Ask "how sure are you?"
            <input type="checkbox" checked={askConfidence} onChange={toggleConfidence} className="h-4 w-4 accent-indigo-600" />
          </label>

          <button type="button" onClick={handleSubmit} disabled={busy} className={`${primaryButton} mt-4 w-full`}>
            {submitLabel}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            {isDaily
              ? "Unattempted questions count against your accuracy and XP."
              : "Unanswered questions are saved and come back in later sessions."}
          </p>
          {abandonMutation.isError && <p className="mt-2 text-xs font-bold text-red-600">Could not end the session. Try again.</p>}
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
