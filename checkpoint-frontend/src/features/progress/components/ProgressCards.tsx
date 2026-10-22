import { Link } from "react-router-dom";
import { useCountUp } from "../../../lib/useCountUp";
import type { MasteryResponse, ProgressOverall, TopicMastery } from "../types/progress.types";

function Kpi({ label, value, suffix = "", hint, accent = false }: { label: string; value: number; suffix?: string; hint: string; accent?: boolean }) {
  const shown = useCountUp(value);
  return (
    <div className="card grid gap-1 p-4">
      <span className="text-[13px] font-semibold text-slate-500">{label}</span>
      <b className={`font-display text-[28px] font-extrabold leading-none ${accent ? "text-rose-500" : "text-slate-800"}`}>
        {shown}
        {suffix}
      </b>
      <span className="text-xs font-semibold text-slate-500">{hint}</span>
    </div>
  );
}

export function KpiRow({ overall }: { overall: ProgressOverall }) {
  const onTrack = Math.max(0, overall.stableCount - overall.overdueCount);
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Kpi label="Questions attempted" value={overall.distinctQuestionsAttempted} hint={`${overall.totalAttempts} answers in total`} />
      <Kpi
        label="Overall accuracy"
        value={Math.round(Number(overall.overallAccuracy))}
        suffix="%"
        hint={`${overall.correctAttempts} correct, ${overall.wrongAttempts} wrong`}
      />
      <Kpi
        label="Due for review"
        value={overall.dueForReviewCount}
        accent={overall.dueForReviewCount > 0}
        hint={`${overall.needsReviewCount} missed last time, ${overall.overdueCount} overdue`}
      />
      <Kpi label="On track" value={onTrack} hint="Answered correctly, next review scheduled" />
    </div>
  );
}

const barColor = (t: TopicMastery) => (t.tier === "NEEDS_WORK" ? "#ef7fa8" : t.tier === "GROWING" ? "#f4c95d" : "#2f9e76");

/** The lowest-scoring topics, so it is obvious where a session helps most. */
export function WeakestCard({ mastery }: { mastery: MasteryResponse | undefined }) {
  const items = mastery?.weakest ?? [];
  return (
    <div className="card grid content-start gap-3 p-5">
      <b className="text-sm text-slate-800">Weakest topics</b>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Answer a few more questions and your weakest topics will show up here.</p>
      ) : (
        items.map((t) => (
          <Link
            key={t.topicId}
            to={`/practice?subject=${t.subjectId}&topic=${t.topicId}`}
            className="grid gap-1 rounded-2xl p-1 transition hover:bg-slate-200/70"
          >
            <span className="flex items-baseline justify-between gap-2 text-sm font-bold text-slate-800">
              <span className="truncate">
                {t.topicName}
                <span className="ml-1.5 text-xs font-semibold text-slate-500">{t.subjectName}</span>
              </span>
              <span>{t.accuracy}%</span>
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-slate-200">
              <i className="block h-full rounded-full" style={{ width: `${t.accuracy}%`, background: barColor(t) }} />
            </span>
          </Link>
        ))
      )}
    </div>
  );
}
