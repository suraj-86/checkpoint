import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { startFast } from "../api/practiceApi";
import { getTopics } from "../../progress/api/progressApi";

export function FastPracticeStartPage() {
  const navigate = useNavigate();
  const [count, setCount] = useState(10);
  const [topicId, setTopicId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [questionType, setQuestionType] = useState("");

  const { data: topics } = useQuery({ queryKey: ["topics"], queryFn: getTopics });

  const startMutation = useMutation({
    mutationFn: startFast,
    onSuccess: (session) => navigate(`/practice/session/${session.sessionId}`),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startMutation.mutate({
      count,
      topicId: topicId || null,
      difficulty: difficulty || null,
      questionType: questionType || null,
    });
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Fast Practice</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Number of questions</label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Topic (optional)</label>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Any topic</option>
            {topics?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Difficulty (optional)</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Any difficulty</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
            <option value="EXPERT">Expert</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Question type (optional)</label>
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Any type</option>
            <option value="MCQ">Multiple choice</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="FILL_IN_BLANK">Fill in the blank</option>
          </select>
        </div>

        {startMutation.isError && (
          <p className="text-sm text-red-600">
            Could not start — no questions match those filters, or you already have a session running.
          </p>
        )}

        <button
          type="submit"
          disabled={startMutation.isPending}
          className="w-full rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {startMutation.isPending ? "Starting..." : "Start Fast Practice"}
        </button>
      </form>
    </div>
  );
}
