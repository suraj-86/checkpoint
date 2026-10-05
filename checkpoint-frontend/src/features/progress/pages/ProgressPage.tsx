import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOverallProgress, getTopicPerformance, getActivity, getSessionHistory } from "../api/progressApi";
import { ActivityChart } from "../components/ActivityChart";

export function ProgressPage() {
  const [page, setPage] = useState(0);

  const { data: overall } = useQuery({ queryKey: ["progress-overall"], queryFn: getOverallProgress });
  const { data: topics } = useQuery({ queryKey: ["progress-topics"], queryFn: getTopicPerformance });
  const { data: activity } = useQuery({ queryKey: ["progress-activity"], queryFn: () => getActivity(30) });
  const { data: history } = useQuery({
    queryKey: ["progress-sessions", page],
    queryFn: () => getSessionHistory(page, 10),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Your Progress</h1>

      {overall && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Questions attempted</p>
            <p className="text-xl font-semibold text-slate-800">{overall.distinctQuestionsAttempted}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Overall accuracy</p>
            <p className="text-xl font-semibold text-slate-800">{overall.overallAccuracy}%</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Needs review</p>
            <p className="text-xl font-semibold text-amber-600">{overall.needsReviewCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Stable</p>
            <p className="text-xl font-semibold text-green-600">{overall.stableCount}</p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Activity (last 30 days)</h2>
        {activity ? (
          <ActivityChart data={activity} days={30} />
        ) : (
          <p className="text-sm text-slate-400">Loading...</p>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">By topic</h2>
        {!topics || topics.length === 0 ? (
          <p className="text-sm text-slate-400">No topic data yet — complete a session to see this.</p>
        ) : (
          <div className="space-y-3">
            {topics.map((t) => (
              <div key={t.topicId}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{t.topicName}</span>
                  <span className="text-slate-500">
                    {t.accuracy}% ({t.correctCount}/{t.questionsAttempted})
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-slate-700"
                    style={{ width: `${Math.min(t.accuracy, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Session history</h2>
        {!history || history.content.length === 0 ? (
          <p className="text-sm text-slate-400">No sessions yet.</p>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {history.content.map((s) => (
                <div key={s.sessionId} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">
                      {s.sessionType === "DAILY" ? "Daily Session" : "Fast Practice"}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">
                      {s.completedAt ? new Date(s.completedAt).toLocaleString() : s.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">
                      {s.correctCount}/{s.correctCount + s.wrongCount} correct
                    </span>
                    {s.xpChange != null && (
                      <span className={s.xpChange >= 0 ? "text-green-600" : "text-red-600"}>
                        {s.xpChange >= 0 ? "+" : ""}
                        {s.xpChange} XP
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-md border border-slate-300 px-3 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-slate-400">
                Page {history.page + 1} of {Math.max(history.totalPages, 1)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page + 1 >= history.totalPages}
                className="rounded-md border border-slate-300 px-3 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
