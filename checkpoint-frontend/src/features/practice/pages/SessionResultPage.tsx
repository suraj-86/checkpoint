import { useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Flame, TrendingUp, TrendingDown } from "lucide-react";
import { completeSession } from "../api/practiceApi";

export function SessionResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const queryClient = useQueryClient();
  const hasRequested = useRef(false);

  const completeMutation = useMutation({
    mutationFn: () => completeSession(sessionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["active-session"] });
    },
  });

  useEffect(() => {
    // Guard against React 18 StrictMode's double-invoke in dev, which
    // would otherwise call POST .../complete twice on mount.
    if (sessionId && !hasRequested.current) {
      hasRequested.current = true;
      completeMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (completeMutation.isPending || completeMutation.isIdle) {
    return <p className="text-center text-slate-500">Finishing up...</p>;
  }

  if (completeMutation.isError) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-red-600">Could not complete the session.</p>
        <Link to="/dashboard" className="mt-3 inline-block text-sm text-slate-600 underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const result = completeMutation.data!;
  const positive = result.xpChange >= 0;

  return (
    <div className="mx-auto max-w-md text-center">
      <Trophy className="mx-auto text-slate-400" size={40} />
      <h1 className="mt-3 text-xl font-semibold text-slate-800">Session complete</h1>

      <div className="mt-6 card p-6">
        <div className="grid grid-cols-2 gap-4 text-left">
          <div>
            <p className="text-xs text-slate-500">Correct</p>
            <p className="text-xl font-semibold text-slate-800">
              {result.correctCount} / {result.primaryQuestionCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Accuracy</p>
            <p className="text-xl font-semibold text-slate-800">
              {result.accuracy != null ? `${result.accuracy}%` : "—"}
            </p>
          </div>
        </div>

        <div className={`mt-4 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium ${
          positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {positive ? "+" : ""}
          {result.xpChange} XP
        </div>

        {result.leveledUp && (
          <p className="mt-3 text-sm font-medium text-amber-600">You leveled up! Now Level {result.level}.</p>
        )}

        {result.streakMilestoneBonus > 0 && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-sm font-medium text-orange-600">
            <Flame size={16} />
            {result.currentStreak}-day streak milestone! +{result.streakMilestoneBonus} XP bonus
          </div>
        )}

        {result.currentStreak > 0 && result.streakMilestoneBonus === 0 && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-slate-500">
            <Flame size={14} className="text-orange-400" />
            Current streak: {result.currentStreak} days
          </p>
        )}
      </div>

      <Link
        to="/dashboard"
        className="mt-6 inline-block rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
