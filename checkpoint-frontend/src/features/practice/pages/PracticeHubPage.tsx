import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { Zap, BookOpen } from "lucide-react";
import { startDaily, getActiveSession } from "../api/practiceApi";

export function PracticeHubPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: active } = useQuery({
    queryKey: ["active-session"],
    queryFn: getActiveSession,
    retry: false,
  });

  const startDailyMutation = useMutation({
    mutationFn: startDaily,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate(`/practice/session/${session.sessionId}`);
    },
  });

  if (active) {
    return (
      <div className="mx-auto max-w-md card p-6 text-center">
        <h1 className="text-lg font-semibold text-slate-800">You have a session in progress</h1>
        <p className="mt-1 text-sm text-slate-500">Finish it before starting a new one.</p>
        <Link
          to={`/practice/session/${active.sessionId}`}
          className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Resume session
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
      <div className="card p-6">
        <BookOpen className="text-slate-500" size={24} />
        <h2 className="mt-3 font-semibold text-slate-800">Daily Session</h2>
        <p className="mt-1 text-sm text-slate-500">
          10 questions, prioritized by what you need to review most. Builds your streak.
        </p>
        <button
          onClick={() => startDailyMutation.mutate()}
          disabled={startDailyMutation.isPending}
          className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {startDailyMutation.isPending ? "Starting..." : "Start Daily Session"}
        </button>
        {startDailyMutation.isError && (
          <p className="mt-2 text-xs text-red-600">Could not start — try again, or check Progress for details.</p>
        )}
      </div>

      <div className="card p-6">
        <Zap className="text-slate-500" size={24} />
        <h2 className="mt-3 font-semibold text-slate-800">Fast Practice</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose how many questions, and filter by topic, difficulty, or type. Doesn't affect your streak.
        </p>
        <Link
          to="/practice/fast"
          className="mt-4 block w-full rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Configure Fast Practice
        </Link>
      </div>
    </div>
  );
}
