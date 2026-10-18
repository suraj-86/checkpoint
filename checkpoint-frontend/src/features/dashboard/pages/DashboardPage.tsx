import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { BookMarked, Brain, CheckCircle2, Flame } from "lucide-react";
import { StatCard } from "../../../components/ui/StatCard";
import { formatDay, plural } from "../../../lib/format";
import { getActivity, getDashboard, getMastery, getOverallProgress, getProfile } from "../../progress/api/progressApi";
import { LevelProgressCard } from "../../../components/ui/LevelProgressCard";
import { ActivityChart } from "../../progress/components/ActivityChart";
import { startDaily } from "../../practice/api/practiceApi";
import { getInterests } from "../../interest/api/interestApi";
import { getPreferences } from "../../preference/api/preferenceApi";
import { MasterySummaryCard, NextMissionCard, QuestsCard, ShortcutsRow, TipCard, pickFocus } from "../components/HomeWidgets";
import { useStudentCatalog } from "../../catalog/hooks/useStudentCatalog";

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: getProfile });

  const { data: interests } = useQuery({
    queryKey: ["interests"],
    queryFn: getInterests,
  });

  const { data: preferences } = useQuery({
    queryKey: ["preferences"],
    queryFn: getPreferences,
  });

  const { data: overall } = useQuery({
    queryKey: ["progress-overall"],
    queryFn: getOverallProgress,
  });

  const { data: catalog } = useStudentCatalog();

  const { data: mastery } = useQuery({ queryKey: ["progress-mastery"], queryFn: getMastery });

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
    return <p className="text-slate-500">Loading...</p>;
  }

  if (isError || !data) {
    return <p className="text-red-600">Could not load your home page. Try refreshing.</p>;
  }

  return (
    <div className="space-y-6">
      {profile && <LevelProgressCard totalXp={profile.totalXp} progress={profile.levelProgress} />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          icon={Brain}
          tone="indigo"
          label="Well remembered"
          value={overall ? overall.stableCount : "–"}
          hint="Questions you answer reliably"
        />
        <StatCard
          icon={CheckCircle2}
          tone="emerald"
          label="Today"
          value={data.dailySessionCompletedToday ? "Done" : "Not yet"}
          hint={data.dailySessionCompletedToday ? "Daily Session completed" : "Daily Session pending"}
        />
      </div>

      {interests && preferences && interests.topicIds.length === 0 && preferences.subjectIds.length === 0 && !preferences.streamId && !preferences.examId && (
        <div className="card border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-900">
          Your Daily Sessions currently include every topic.{" "}
          <Link to="/profile" className="font-medium underline">
            Choose your stream, subjects or topics
          </Link>{" "}
          to focus your practice.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <NextMissionCard
          data={data}
          focus={pickFocus(mastery, interests, preferences, catalog)}
          starting={startDailyMutation.isPending}
          startFailed={startDailyMutation.isError}
          onStartDaily={() => startDailyMutation.mutate()}
        />
        <MasterySummaryCard overall={overall} mastery={mastery} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <QuestsCard data={data} />
        </div>
        <TipCard />
      </div>

      <ShortcutsRow />

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
