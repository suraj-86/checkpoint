import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { BookMarked, CheckCircle2, Flame, Zap } from "lucide-react";
import { Donut } from "../../../components/ui/Donut";
import { StatCard } from "../../../components/ui/StatCard";
import { primaryButton, secondaryButton } from "../../../components/ui/styles";
import { formatDay, plural } from "../../../lib/format";
import { getActivity, getDashboard, getOverallProgress } from "../../progress/api/progressApi";
import { ActivityChart } from "../../progress/components/ActivityChart";
import { startDaily } from "../../practice/api/practiceApi";
import { getInterests } from "../../interest/api/interestApi";

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const { data: interests } = useQuery({
    queryKey: ["interests"],
    queryFn: getInterests,
  });

  const { data: overall } = useQuery({
    queryKey: ["progress-overall"],
    queryFn: getOverallProgress,
  });

  const { data: activity } = useQuery({
    queryKey: ["progress-activity", 14],
    queryFn: () => getActivity(14),
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Zap} tone="indigo" label="Total XP" value={data.totalXp} hint={`Level ${data.level}`} />
        <StatCard
          icon={Flame}
          tone="amber"
          label="Current streak"
          value={plural(data.currentStreak, "day")}
          hint={`Longest: ${plural(data.longestStreak, "day")}`}
        />
        <StatCard
          icon={BookMarked}
          tone="rose"
          label="Due for review"
          value={data.questionsNeedingReview}
          hint="Prioritised in your next Daily Session"
        />
        <StatCard
          icon={CheckCircle2}
          tone="emerald"
          label="Today"
          value={data.dailySessionCompletedToday ? "Done" : "Not yet"}
          hint={data.dailySessionCompletedToday ? "Daily Session completed" : "Daily Session pending"}
        />
      </div>

      {interests && interests.topicIds.length === 0 && (
        <div className="card border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-900">
          Your Daily Sessions currently include every topic.{" "}
          <Link to="/profile" className="font-medium underline">
            Choose the topics you care about
          </Link>{" "}
          to focus your practice.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card flex flex-col justify-center p-6 lg:col-span-2">
          {data.hasActiveSession ? (
            <div>
              <h2 className="text-lg font-semibold text-slate-800">You have a session in progress</h2>
              <p className="mt-1 text-sm text-slate-500">Pick up where you left off.</p>
              <Link to="/practice/active" className={`${primaryButton} mt-4 inline-block`}>
                Resume session
              </Link>
            </div>
          ) : data.dailySessionCompletedToday ? (
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Daily Session complete for today</h2>
              <p className="mt-1 text-sm text-slate-500">
                Come back tomorrow to keep your streak going, or try Fast Practice for extra reps.
              </p>
              <Link to="/practice/fast" className={`${secondaryButton} mt-4 inline-block`}>
                Start Fast Practice
              </Link>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Ready for today's Daily Session?</h2>
              <p className="mt-1 text-sm text-slate-500">
                10 questions, prioritised by what you need to review most.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => startDailyMutation.mutate()}
                  disabled={startDailyMutation.isPending}
                  className={primaryButton}
                >
                  {startDailyMutation.isPending ? "Starting..." : "Start Daily Session"}
                </button>
                <Link to="/practice/fast" className={secondaryButton}>
                  Fast Practice
                </Link>
              </div>
              {startDailyMutation.isError && (
                <p className="mt-3 text-sm text-red-600">
                  Could not start a session. You may already have one, or there aren't enough questions yet.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="card flex flex-col items-center justify-center p-6 text-center">
          <p className="text-sm text-slate-500">Overall accuracy</p>
          <div className="mt-3">
            <Donut value={overall ? Number(overall.overallAccuracy) : 0} size={110} stroke={11} />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {overall ? `${overall.distinctQuestionsAttempted} questions attempted` : "Loading..."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Activity, last 14 days</h2>
            <Link to="/progress" className="text-xs font-medium text-indigo-600 hover:underline">
              Full progress
            </Link>
          </div>
          <div className="mt-3">{activity ? <ActivityChart data={activity} days={14} /> : <p className="text-sm text-slate-400">Loading...</p>}</div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700">Recent sessions</h2>
          {data.recentSessions.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No sessions yet. Start your first one above.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {data.recentSessions.slice(0, 5).map((s) => (
                <li key={s.sessionId} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{s.sessionType === "DAILY" ? "Daily Session" : "Fast Practice"}</p>
                    <p className="text-xs text-slate-400">
                      {formatDay(s.completedAt ?? s.startedAt)}
                      {s.status === "ABANDONED" && " · ended early"}
                    </p>
                  </div>
                  <div className="text-right">
                    {s.accuracy !== null && <p className="text-slate-600">{Math.round(Number(s.accuracy))}%</p>}
                    {s.xpChange !== null && (
                      <p className={`text-xs font-medium ${s.xpChange >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                        {s.xpChange >= 0 ? "+" : ""}
                        {s.xpChange} XP
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
