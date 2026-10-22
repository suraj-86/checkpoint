import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { secondaryButton } from "../../../components/ui/styles";
import { formatDateTime } from "../../../lib/format";
import {
  getActivity,
  getMastery,
  getOverallProgress,
  getProfile,
  getSessionHistory,
} from "../api/progressApi";
import { LevelProgressCard } from "../../../components/ui/LevelProgressCard";
import { ActivityHeatmap } from "../components/ActivityHeatmap";
import { KpiRow, WeakestCard } from "../components/ProgressCards";
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
  const { data: mastery } = useQuery({ queryKey: ["progress-mastery"], queryFn: getMastery });
  const { data: activity } = useQuery({ queryKey: ["progress-activity", 371], queryFn: () => getActivity(371) });
  const { data: history } = useQuery({
    queryKey: ["progress-sessions", page],
    queryFn: () => getSessionHistory(page, 10),
  });

  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">Your knowledge map</p>
        <h1 className="font-display text-[clamp(28px,4vw,40px)] font-extrabold leading-tight text-slate-800">Progress</h1>
      </div>

      {profile && <LevelProgressCard totalXp={profile.totalXp} progress={profile.levelProgress} />}
      {overall && <KpiRow overall={overall} />}

      <MasteryMap />

      <h2 className="mt-2 font-display text-2xl font-bold text-slate-800">Analytics</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <b className="text-sm text-slate-800">Activity, last year</b>
          <div className="mt-3">{activity ? <ActivityHeatmap data={activity} /> : <p className="text-sm text-slate-500">Loading...</p>}</div>
        </div>
        <WeakestCard mastery={mastery} />
        <div className="card p-5">
          <b className="text-sm text-slate-800">Sessions per day, last 30 days</b>
          <div className="mt-3">{activity ? <ActivityChart data={activity} days={30} /> : <p className="text-sm text-slate-500">Loading...</p>}</div>
        </div>
        <div className="card p-5 lg:col-span-2">
          <b className="text-sm text-slate-800">XP growth, last 30 days</b>
          <div className="mt-3">
            {activity && profile ? (
              <XpTrendChart data={activity} days={30} currentXp={profile.totalXp} />
            ) : (
              <p className="text-sm text-slate-500">Loading...</p>
            )}
          </div>
        </div>
      </div>

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
