import type { ElementType, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { Flame, Zap, BookMarked, CheckCircle2, Clock } from "lucide-react";
import { getDashboard } from "../../progress/api/progressApi";
import { startDaily } from "../../practice/api/practiceApi";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={16} />
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const startDailyMutation = useMutation({
    mutationFn: startDaily,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate(`/practice/session/${session.sessionId}`);
    },
  });

  if (isLoading) {
    return <p className="text-slate-500">Loading dashboard...</p>;
  }

  if (isError || !data) {
    return <p className="text-red-600">Could not load your dashboard. Try refreshing.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Welcome back, {data.username}</h1>
          <p className="text-slate-500">
            Level {data.level} &middot; {data.totalXp} XP
          </p>
        </div>
        {data.currentStreak > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-orange-600">
            <Flame size={18} />
            <span className="font-semibold">{data.currentStreak}-day streak</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Zap} label="Total XP" value={data.totalXp} />
        <StatCard icon={Flame} label="Longest Streak" value={data.longestStreak} />
        <StatCard icon={BookMarked} label="Needs Review" value={data.questionsNeedingReview} />
        <StatCard
          icon={CheckCircle2}
          label="Today"
          value={data.dailySessionCompletedToday ? "Done" : "Not yet"}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {data.hasActiveSession ? (
          <div>
            <h2 className="font-semibold text-slate-800">You have a session in progress</h2>
            <p className="mt-1 text-sm text-slate-500">Pick up where you left off.</p>
            <Link
              to="/practice/active"
              className="mt-3 inline-block rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Resume session
            </Link>
          </div>
        ) : data.dailySessionCompletedToday ? (
          <div>
            <h2 className="font-semibold text-slate-800">Daily Session complete for today</h2>
            <p className="mt-1 text-sm text-slate-500">
              Come back tomorrow to keep your streak going, or try Fast Practice for extra reps.
            </p>
            <Link
              to="/practice/fast"
              className="mt-3 inline-block rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Start Fast Practice
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="font-semibold text-slate-800">Ready for today's Daily Session?</h2>
            <p className="mt-1 text-sm text-slate-500">10 questions, prioritized by what you need to review most.</p>
            <button
              onClick={() => startDailyMutation.mutate()}
              disabled={startDailyMutation.isPending}
              className="mt-3 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {startDailyMutation.isPending ? "Starting..." : "Start Daily Session"}
            </button>
            {startDailyMutation.isError && (
              <p className="mt-2 text-sm text-red-600">
                Could not start a session. You may already have one, or there aren't enough questions yet.
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-slate-800">Recent sessions</h2>
        {data.recentSessions.length === 0 ? (
          <p className="text-sm text-slate-500">No completed sessions yet.</p>
        ) : (
          <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {data.recentSessions.map((s) => (
              <div key={s.sessionId} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">
                    {s.sessionType === "DAILY" ? "Daily Session" : "Fast Practice"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-500">{s.accuracy?.toFixed(0) ?? 0}% accuracy</span>
                  <span className={s.xpChange != null && s.xpChange >= 0 ? "text-green-600" : "text-red-600"}>
                    {s.xpChange != null ? `${s.xpChange >= 0 ? "+" : ""}${s.xpChange} XP` : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
