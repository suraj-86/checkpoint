import { Link } from "react-router-dom";
import { ArrowRight, Check, Circle, History, Lightbulb, Network, Target, User, Zap } from "lucide-react";
import { Donut } from "../../../components/ui/Donut";
import { primaryButton, secondaryButton } from "../../../components/ui/styles";
import type { Interests } from "../../interest/api/interestApi";
import type { Preferences } from "../../preference/api/preferenceApi";
import type { Dashboard, MasteryResponse, MasteryTier, ProgressOverall, TopicMastery } from "../../progress/types/progress.types";

interface ScopeCatalog {
  streams: { id: string; subjectIds: string[] }[];
  exams: { id: string; subjectIds: string[] }[];
}


export function pickFocus(
  mastery: MasteryResponse | undefined,
  interests: Interests | undefined,
  preferences: Preferences | undefined,
  catalog: ScopeCatalog | undefined
): TopicMastery | undefined {
  if (!mastery) return undefined;
  const topicIds = new Set(interests?.topicIds ?? []);
  let subjectIds: Set<string> | null = null;
  if (topicIds.size === 0) {
    if (preferences && preferences.subjectIds.length > 0) {
      subjectIds = new Set(preferences.subjectIds);
    } else if (preferences?.examId) {
      subjectIds = new Set(catalog?.exams.find((e) => e.id === preferences.examId)?.subjectIds ?? []);
    } else if (preferences?.streamId) {
      subjectIds = new Set(catalog?.streams.find((x) => x.id === preferences.streamId)?.subjectIds ?? []);
    }
  }
  const inScope = (t: TopicMastery) =>
    topicIds.size > 0 ? topicIds.has(t.topicId) : subjectIds === null || subjectIds.size === 0 || subjectIds.has(t.subjectId);

  const topics = mastery.subjects.flatMap((s) => s.topics).filter(inScope);
  const needsWork = topics.filter((t) => t.tier === "NEEDS_WORK").sort((a, b) => a.accuracy - b.accuracy);
  if (needsWork.length > 0) return needsWork[0];
  return topics.find((t) => t.tier === "NOT_STARTED");
}

export function NextMissionCard({
  data,
  focus,
  starting,
  startFailed,
  onStartDaily,
}: {
  data: Dashboard;
  focus: TopicMastery | undefined;
  starting: boolean;
  startFailed: boolean;
  onStartDaily: () => void;
}) {
  return (
    <div className="card flex flex-col justify-center p-6 lg:col-span-2">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-indigo-600">
        <Target size={14} /> Your next mission
      </div>

      {data.hasActiveSession ? (
        <>
          <h2 className="mt-2 text-lg font-semibold text-slate-800">You have a session in progress</h2>
          <p className="mt-1 text-sm text-slate-500">Pick up where you left off.</p>
          <div className="mt-4">
            <Link to="/practice/active" className={`${primaryButton} inline-block`}>
              Resume session
            </Link>
          </div>
        </>
      ) : !data.dailySessionCompletedToday ? (
        <>
          <h2 className="mt-2 text-lg font-semibold text-slate-800">Today's Daily Session is waiting</h2>
          <p className="mt-1 text-sm text-slate-500">
            10 questions
            {data.questionsNeedingReview > 0
              ? `, starting with the ${data.questionsNeedingReview} you are due to review.`
              : ", picked from your chosen topics."}{" "}
            Finishing it keeps your streak alive.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={onStartDaily} disabled={starting} className={primaryButton}>
              {starting ? "Starting..." : "Start Daily Session"}
            </button>
            <Link to="/practice" className={secondaryButton}>
              Fast Practice
            </Link>
          </div>
          {startFailed && (
            <p className="mt-3 text-sm text-red-600">
              Could not start a session. You may already have one, or there aren't enough questions yet.
            </p>
          )}
        </>
      ) : focus ? (
        <>
          <h2 className="mt-2 text-lg font-semibold text-slate-800">
            Daily Session done. {focus.tier === "NEEDS_WORK" ? "Strengthen" : "Try"} {focus.topicName}?
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {focus.tier === "NEEDS_WORK"
              ? `It is your weakest topic in ${focus.subjectName} right now (${focus.accuracy}% correct). A quick round will help it stick.`
              : `You have not tried it yet in ${focus.subjectName}. A short round is a good way to start.`}
          </p>
          <div className="mt-4">
            <Link
              to={`/practice?subject=${focus.subjectId}&topic=${focus.topicId}`}
              className={`${primaryButton} inline-flex items-center gap-2`}
            >
              Practise {focus.topicName} <ArrowRight size={14} />
            </Link>
          </div>
        </>
      ) : (
        <>
          <h2 className="mt-2 text-lg font-semibold text-slate-800">Daily Session complete for today</h2>
          <p className="mt-1 text-sm text-slate-500">Come back tomorrow to keep your streak going, or try Fast Practice for extra reps.</p>
          <div className="mt-4">
            <Link to="/practice" className={`${secondaryButton} inline-block`}>
              Start Fast Practice
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export function QuestsCard({ data }: { data: Dashboard }) {
  const today = new Date().toDateString();
  const fastToday = data.recentSessions.some(
    (s) =>
      s.sessionType !== "DAILY" &&
      s.status !== "ABANDONED" &&
      s.completedAt !== null &&
      new Date(s.completedAt).toDateString() === today
  );
  const quests = [
    { label: "Finish today's Daily Session", done: data.dailySessionCompletedToday, hint: null as string | null },
    { label: "Do one Fast Practice round", done: fastToday, hint: null },
    {
      label: "Clear your review backlog",
      done: data.questionsNeedingReview === 0,
      hint: data.questionsNeedingReview > 0 ? `${data.questionsNeedingReview} due` : null,
    },
  ];
  const completed = quests.filter((q) => q.done).length;

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Today's quests</h2>
        <span className="text-xs text-slate-500">
          {completed} of {quests.length} done
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-indigo-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
          style={{ width: `${(completed / quests.length) * 100}%` }}
        />
      </div>
      <ul className="mt-3 space-y-2">
        {quests.map((q) => (
          <li key={q.label} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                q.done ? "bg-emerald-500 text-white" : "border border-slate-300 text-slate-300"
              }`}
            >
              {q.done ? <Check size={12} /> : <Circle size={8} />}
            </span>
            <span className={q.done ? "text-slate-400 line-through" : "text-slate-700"}>{q.label}</span>
            {q.hint && <span className="ml-auto text-xs text-rose-500">{q.hint}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

const TIER_ROWS: { tier: MasteryTier; label: string; color: string }[] = [
  { tier: "STRONG", label: "Strong", color: "#10b981" },
  { tier: "GROWING", label: "Getting there", color: "#fbbf24" },
  { tier: "NEEDS_WORK", label: "Needs work", color: "#fb7185" },
  { tier: "STARTED", label: "Just started", color: "#38bdf8" },
  { tier: "NOT_STARTED", label: "Not started", color: "#cbd5e1" },
];

export function MasterySummaryCard({
  overall,
  mastery,
}: {
  overall: ProgressOverall | undefined;
  mastery: MasteryResponse | undefined;
}) {
  const counts = new Map<MasteryTier, number>();
  mastery?.subjects.forEach((s) => s.topics.forEach((t) => counts.set(t.tier, (counts.get(t.tier) ?? 0) + 1)));

  return (
    <div className="card flex flex-col p-5">
      <p className="text-center text-sm text-slate-500">Overall accuracy</p>
      <div className="mt-2 flex justify-center">
        <Donut value={overall ? Number(overall.overallAccuracy) : 0} size={96} stroke={10} />
      </div>
      <p className="mt-2 text-center text-xs text-slate-500">
        {overall ? `${overall.distinctQuestionsAttempted} questions attempted` : "Loading..."}
      </p>
      <ul className="mt-3 space-y-1 text-xs text-slate-600">
        {TIER_ROWS.filter((r) => counts.get(r.tier)).map((r) => (
          <li key={r.tier} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
            {r.label}
            <span className="ml-auto font-medium text-slate-800">{counts.get(r.tier)}</span>
          </li>
        ))}
      </ul>
      <Link to="/progress" className="mt-auto pt-3 text-center text-xs font-medium text-indigo-600 hover:underline">
        Open mastery map
      </Link>
    </div>
  );
}

const SHORTCUTS = [
  { to: "/practice", label: "Practice", hint: "Daily or Fast", icon: Zap },
  { to: "/progress", label: "Mastery map", hint: "See where you stand", icon: Network },
  { to: "/history", label: "History", hint: "Review old sessions", icon: History },
  { to: "/profile", label: "Profile", hint: "Choose what to learn", icon: User },
];

export function ShortcutsRow() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {SHORTCUTS.map(({ to, label, hint, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="card group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/70"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <Icon size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{label}</p>
            <p className="text-xs text-slate-500">{hint}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

const TIPS = [
  "Short and regular beats long and rare. Ten questions a day builds more than one marathon a week.",
  "Missed a question? Read the explanation before moving on. That is where the learning happens.",
  "Questions you got wrong come back for review. Answering them correctly is what makes them stick.",
  "Try Fast Practice on your weakest topic. It is the quickest way to turn a red node green.",
  "Keep your streak alive with the Daily Session, even on busy days. It only takes a few minutes.",
  "Guessing is fine early on. The review schedule will bring the shaky ones back until you know them.",
  "Use the mastery map to pick your next topic instead of always practising what you already know.",
];

export function TipCard() {
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return (
    <div className="card flex items-start gap-3 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
        <Lightbulb size={18} />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Tip of the day</p>
        <p className="mt-0.5 text-sm text-slate-700">{TIPS[dayIndex % TIPS.length]}</p>
      </div>
    </div>
  );
}
