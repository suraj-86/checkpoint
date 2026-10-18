import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookMarked, CheckCircle2, ChevronRight, Target } from "lucide-react";
import { Donut } from "../../../components/ui/Donut";
import { StatCard } from "../../../components/ui/StatCard";
import { secondaryButton } from "../../../components/ui/styles";
import { formatDateTime } from "../../../lib/format";
import {
  getActivity,
  getOverallProgress,
  getProfile,
  getSessionHistory,
} from "../api/progressApi";
import { LevelProgressCard } from "../../../components/ui/LevelProgressCard";
import { ActivityChart } from "../components/ActivityChart";
import { XpTrendChart } from "../components/XpTrendChart";
import { MasteryMap } from "../components/MasteryMap";

const STATUS_LABELS: Record<string, { text: string; className: string }> = {
  IN_PROGRESS: { text: "In progress", className: "bg-sky-100 text-sky-700" },
  ABANDONED: { text: "Ended early", className: "bg-amber-100 text-amber-700" },
};

export function ProgressPage() {
  const [page, setPage] = useState(0);

  const { data: overall } = useQuery({ queryKey: ["progress-overall"], queryFn: getOverallProgress });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const { data: activity } = useQuery({ queryKey: ["progress-activity", 30], queryFn: () => getActivity(30) });
  const { data: history } = useQuery({
    queryKey: ["progress-sessions", page],
    queryFn: () => getSessionHistory(page, 10),
  });

  const onTrack = overall ? Math.max(0, overall.stableCount - overall.overdueCount) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Your Progress</h1>

      {profile && <LevelProgressCard totalXp={profile.totalXp} progress={profile.levelProgress} />}

      {overall && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Target}
            tone="indigo"
            label="Questions attempted"
            value={overall.distinctQuestionsAttempted}
            hint={`${overall.totalAttempts} answers in total`}
          />

          <div className="card flex items-center gap-4 p-4">
            <Donut value={Number(overall.overallAccuracy)} size={72} stroke={8} />
            <div>
              <p className="text-sm text-slate-500">Overall accuracy</p>
              <p className="text-xs text-slate-500">
                {overall.correctAttempts} correct, {overall.wrongAttempts} wrong
              </p>
            </div>
          </div>

          <StatCard
            icon={BookMarked}
            tone="rose"
            label="Due for review"
            value={overall.dueForReviewCount}
            hint={`${overall.needsReviewCount} missed last time, ${overall.overdueCount} overdue`}
          />
          <StatCard
            icon={CheckCircle2}
            tone="emerald"
            label="On track"
            value={onTrack}
            hint="Answered correctly, next review scheduled"
          />
        </div>
      )}

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700">Activity, last 30 days</h2>
        <div className="mt-3">
          {activity ? <ActivityChart data={activity} days={30} /> : <p className="text-sm text-slate-400">Loading...</p>}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700">XP growth, last 30 days</h2>
        <div className="mt-3">
          {activity && profile ? (
            <XpTrendChart data={activity} days={30} currentXp={profile.totalXp} />
          ) : (
            <p className="text-sm text-slate-400">Loading...</p>
          )}
        </div>
      </div>

      <MasteryMap />

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Session history</h2>
          <Link to="/history" className="text-sm font-medium text-indigo-600 hover:underline">
            Search all history
          </Link>
        </div>
        {!history ? (
          <p className="mt-3 text-sm text-slate-400">Loading...</p>
        ) : history.content.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No sessions yet.</p>
        ) : (
          <>
            <ul className="mt-3 divide-y divide-slate-100">
              {history.content.map((s) => {
                const label = STATUS_LABELS[s.status];
                const answered = s.correctCount + s.wrongCount;
                return (
                  <li key={s.sessionId}>
                  <Link
                    to={s.status === "IN_PROGRESS" ? "/practice/active" : `/progress/sessions/${s.sessionId}`}
                    className="group -mx-2 flex flex-wrap items-center justify-between gap-2 rounded-xl px-2 py-3 text-sm transition hover:bg-indigo-50/60"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">
                        {s.sessionType === "DAILY" ? "Daily Session" : "Fast Practice"}
                      </span>
                      {label && (
                        <span className={`rounded-full px-2 py-0.5 text-xs ${label.className}`}>{label.text}</span>
                      )}
                      <span className="text-xs text-slate-400">{formatDateTime(s.completedAt ?? s.startedAt)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <span>
                        {s.correctCount}/{answered} correct
                      </span>
                      {s.xpChange !== null && (
                        <span className={`w-16 text-right font-medium ${s.xpChange >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          {s.xpChange >= 0 ? "+" : ""}
                          {s.xpChange} XP
                        </span>
                      )}
                      <ChevronRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                    </div>
                  </Link>
                  </li>
                );
              })}
            </ul>

            {history.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className={secondaryButton}
                >
                  Previous
                </button>
                <span>
                  Page {history.page + 1} of {history.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page + 1 >= history.totalPages}
                  className={secondaryButton}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
