import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { abandonSession, getActiveSession, submitAnswer } from "../api/practiceApi";
import type { AnswerResult } from "../types/practice.types";

export function PracticeSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [textAnswer, setTextAnswer] = useState("");
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [ending, setEnding] = useState(false);

  const { data: active, isLoading } = useQuery({
    queryKey: ["active-session"],
    queryFn: getActiveSession,
    enabled: !feedback && !ending, // don't refetch out from under an answer the student is reviewing
  });

  const answerMutation = useMutation({
    mutationFn: (answer: string | boolean) => {
      if (!sessionId || !active?.currentQuestion) throw new Error("No active question");
      return submitAnswer(sessionId, { questionId: active.currentQuestion.id, answer });
    },
    onSuccess: (result) => setFeedback(result),
  });

  const endMutation = useMutation({
    mutationFn: () => {
      if (!sessionId) throw new Error("No session");
      return abandonSession(sessionId);
    },
    onMutate: () => setEnding(true),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["active-session"] });
      navigate("/dashboard");
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] !== "active-session" });
    },
    onError: () => setEnding(false),
  });

  function handleEndSession() {
    const confirmed = window.confirm(
      "End this session now? Your answers so far are saved to your progress, but this session will not earn XP or count towards your streak."
    );
    if (confirmed) {
      endMutation.mutate();
    }
  }

  async function handleContinue() {
    setFeedback(null);
    setTextAnswer("");
    const fresh = await queryClient.fetchQuery({ queryKey: ["active-session"], queryFn: getActiveSession });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    if (!fresh.currentQuestion) {
      navigate(`/practice/result/${sessionId}`);
    }
  }

  const allAnswered = !isLoading && !active?.currentQuestion && !feedback;

  useEffect(() => {
    // Every slot already answered (e.g. the student refreshed right at
    // the end). Done as an effect, not during render, so this is a
    // proper navigation side-effect rather than one that fires mid-render.
    if (allAnswered) {
      navigate(`/practice/result/${sessionId}`);
    }
  }, [allAnswered, navigate, sessionId]);

  if (isLoading && !active) {
    return <p className="text-slate-500">Loading session...</p>;
  }

  if (allAnswered) {
    return null;
  }

  const q = active?.currentQuestion;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
        <span>
          Question {(active?.answeredSlots ?? 0) + 1} of {active?.totalSlots ?? "?"}
        </span>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {q?.difficulty}
          </span>
          <button
            type="button"
            onClick={handleEndSession}
            disabled={endMutation.isPending || answerMutation.isPending}
            className="text-xs text-slate-500 underline hover:text-red-600 disabled:opacity-40"
          >
            End session
          </button>
        </div>
      </div>
      {endMutation.isError && (
        <p className="mb-2 text-xs text-red-600">Could not end the session. Please try again.</p>
      )}

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-indigo-600 transition-all"
          style={{
            width: `${active ? (active.answeredSlots / Math.max(active.totalSlots, 1)) * 100 : 0}%`,
          }}
        />
      </div>

      <div className="mt-6 card p-6">
        <p className="whitespace-pre-wrap text-lg font-medium text-slate-800">{q?.question}</p>

        {!feedback && q?.type === "MCQ" && q.options && (
          <div className="mt-4 space-y-2">
            {q.options.map((opt) => (
              <button
                key={opt}
                onClick={() => answerMutation.mutate(opt)}
                disabled={answerMutation.isPending}
                className="block w-full rounded-md border border-slate-300 px-4 py-2.5 text-left text-sm hover:border-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {!feedback && q?.type === "TRUE_FALSE" && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => answerMutation.mutate(true)}
              disabled={answerMutation.isPending}
              className="flex-1 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium hover:border-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              True
            </button>
            <button
              onClick={() => answerMutation.mutate(false)}
              disabled={answerMutation.isPending}
              className="flex-1 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium hover:border-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              False
            </button>
          </div>
        )}

        {!feedback && q?.type === "FILL_IN_BLANK" && (
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={answerMutation.isPending || !textAnswer.trim()}
              className="mt-3 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Submit
            </button>
          </form>
        )}

        {feedback && (
          <div className="mt-4 space-y-3">
            <div
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                feedback.correct ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              {feedback.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              {feedback.correct ? "Correct!" : "Not quite."}
              {feedback.requeued && <span className="text-xs font-normal">(this one will come back around)</span>}
            </div>
            {!feedback.correct && (
              <p className="text-sm text-slate-600">
                Correct answer:{" "}
                <span className="font-medium text-slate-800">{String(feedback.correctAnswer)}</span>
              </p>
            )}
            <p className="text-sm text-slate-500">{feedback.explanation}</p>
            <button
              onClick={handleContinue}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
