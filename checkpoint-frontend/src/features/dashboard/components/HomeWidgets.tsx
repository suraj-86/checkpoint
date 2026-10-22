import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Circle, Lightbulb } from "lucide-react";
import { Mascot, type MascotMood } from "../../../components/mascot/Mascot";
import { useEquippedSkin } from "../../rewards/hooks/useRewards";
import { formatDay } from "../../../lib/format";
import { useCountUp } from "../../../lib/useCountUp";
import { Donut } from "../../../components/ui/Donut";
import type { Interests } from "../../interest/api/interestApi";
import type { Preferences } from "../../preference/api/preferenceApi";
import type { Dashboard, MasteryResponse, MasteryTier, ProgressOverall, SessionSummary, TopicMastery } from "../../progress/types/progress.types";

interface ScopeCatalog {
  streams: { id: string; subjectIds: string[] }[];
  exams: { id: string; subjectIds: string[] }[];
}

/**
 * The topic to suggest next, limited to what the student chose to practise.
 * Uses the same precedence as Daily Sessions: picked topics, then picked
 * subjects, then the exam's subjects, then the stream's subjects, else everything.
 */
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

export function HeroCard({
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
  const inProgress = data.hasActiveSession;
  const done = data.dailySessionCompletedToday;
  const mood: MascotMood = inProgress ? "hype" : done ? "proud" : "idle";
  const skin = useEquippedSkin();

  let title = "Ten questions, one happy garden.";
  let text: string;
  let actions: ReactNode;

  if (inProgress) {
    title = "You have a session in progress.";
    text = "Pick up where you left off.";
    actions = (
      <Link to="/practice/active" className="btn-white">
        Resume session
      </Link>
    );
  } else if (!done) {
    text =
      (data.questionsNeedingReview > 0
        ? `10 questions, starting with the ${data.questionsNeedingReview} you are due to review. `
        : "10 questions from the topics you chose. ") +
      (data.currentStreak > 0
        ? `Finish today to keep your ${data.currentStreak}-day streak.`
        : "Finish today to start your streak.");
    actions = (
      <>
        <button onClick={onStartDaily} disabled={starting} className="btn-white disabled:opacity-60">
          {starting ? "Starting..." : "Start Daily Session"}
        </button>
        <Link to="/practice" className="btn-white !bg-white/20 !text-white">
          Fast Practice
        </Link>
      </>
    );
  } else if (focus) {
    title = "Daily Session done. Nicely planted.";
    text =
      focus.tier === "NEEDS_WORK"
        ? `${focus.topicName} in ${focus.subjectName} is your weakest right now (${focus.accuracy}% correct). A quick round will help it stick.`
        : `You have not tried ${focus.topicName} in ${focus.subjectName} yet. A short round is a good way to start.`;
    actions = (
      <Link to={`/practice?subject=${focus.subjectId}&topic=${focus.topicId}`} className="btn-white">
        Practise {focus.topicName} <ArrowRight size={14} />
      </Link>
    );
  } else {
    title = "Daily Session done. Nicely planted.";
    text = "Come back tomorrow to keep your streak going, or try Fast Practice for extra reps.";
    actions = (
      <Link to="/practice" className="btn-white">
        Start Fast Practice
      </Link>
    );
  }

  return (
    <div className="hero-card grid min-h-[250px] content-center gap-3 p-6 sm:p-7 sm:pr-[200px]">
      <div className="w-[96px] drop-shadow-[0_6px_0_rgba(47,36,87,0.2)] sm:hidden">
        <Mascot skin={skin} mood={mood} size={96} />
      </div>
      <h2 className="max-w-[16ch] text-[clamp(26px,3vw,40px)] font-extrabold leading-[1.05] tracking-tight">{title}</h2>
      <p className="max-w-[34ch] text-[15px] text-violet-50">{text}</p>
      <div className="relative z-10 flex flex-wrap items-center gap-3">{actions}</div>
      {startFailed && (
        <p className="relative z-10 text-sm font-semibold text-rose-100">
          Could not start a session. You may already have one, or there aren't enough questions yet.
        </p>
      )}
      <div className="pointer-events-none absolute bottom-0 right-4 hidden w-[180px] drop-shadow-[0_6px_0_rgba(47,36,87,0.2)] sm:block">
        <Mascot skin={skin} mood={mood} size={180} />
      </div>
    </div>
  );
}

/** Accuracy of the last few finished sessions, drawn as a soft area chart. */
export function AccuracyTrendCard({ sessions }: { sessions: SessionSummary[] }) {
  const points = sessions
    .filter((s) => s.accuracy !== null && s.completedAt !== null && s.status !== "ABANDONED")
    .slice(0, 10)
    .map((s) => Math.round(Number(s.accuracy)))
    .reverse();
  const last = points[points.length - 1];

  const W = 300;
  const H = 130;
  const x = (i: number) => (points.length === 1 ? W / 2 : (i * (W - 12)) / (points.length - 1) + 6);
  const y = (v: number) => H - 14 - (v / 100) * (H - 30);
  const line = points.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = points.length > 1 ? `${line} L${x(points.length - 1).toFixed(1)} ${H} L${x(0).toFixed(1)} ${H} Z` : "";

  return (
    <div className="card grid content-start gap-2 p-5">
      <div className="flex items-center justify-between">
        <b className="text-sm text-slate-800">Accuracy, recent sessions</b>
        {last !== undefined && <span className="text-sm font-bold text-emerald-600">Latest {last}%</span>}
      </div>
      {points.length < 2 ? (
        <div className="grid flex-1 place-items-center py-6 text-center text-sm font-semibold text-slate-500">
          Finish two sessions to see your trend.
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Accuracy over your recent sessions">
          <defs>
            <linearGradient id="acc-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b6cf0" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b6cf0" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#acc-fill)" />
          <path d={line} fill="none" stroke="#8b6cf0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={x(points.length - 1)} cy={y(last)} r="5" fill="#f4c95d" stroke="#8b6cf0" strokeWidth="2" />
        </svg>
      )}
    </div>
  );
}

function Stat({ label, value, suffix = "", accent = false }: { label: string; value: number; suffix?: string; accent?: boolean }) {
  const shown = useCountUp(value);
  return (
    <div>
      <span className="text-[13px] font-semibold text-slate-500">{label}</span>
      <b className={`block font-display text-[clamp(26px,3.4vw,38px)] font-extrabold leading-tight ${accent ? "text-rose-500" : "text-slate-800"}`}>
        {shown}
        {suffix}
      </b>
    </div>
  );
}

export function StatsStrip({ data, overall }: { data: Dashboard; overall: ProgressOverall | undefined }) {
  return (
    <div className="card grid grid-cols-2 content-center gap-x-4 gap-y-6 !bg-slate-200 p-5">
      <Stat label="Streak" value={data.currentStreak} suffix={data.currentStreak === 1 ? " day" : " days"} />
      <Stat label="Accuracy" value={overall ? Math.round(Number(overall.overallAccuracy)) : 0} suffix="%" />
      <Stat label="Solved" value={overall ? overall.distinctQuestionsAttempted : 0} />
      <Stat label="Reviews due" value={data.questionsNeedingReview} accent={data.questionsNeedingReview > 0} />
    </div>
  );
}

/** The topic that most needs attention, framed as a plant that needs water. */
export function WiltingCard({ focus }: { focus: TopicMastery | undefined }) {
  if (!focus) {
    return (
      <div className="card grid content-start gap-2.5 p-5">
        <h3 className="text-lg font-bold text-slate-800">Everything is in bloom</h3>
        <p className="text-sm text-slate-500">Nothing needs extra attention in the topics you chose. Have a look at your whole tree.</p>
        <div>
          <Link to="/progress" className="btn-secondary">
            Open your tree
          </Link>
        </div>
      </div>
    );
  }
  const weak = focus.tier === "NEEDS_WORK";
  // Many subjects have a single "General" topic; the subject name reads better.
  const label = focus.topicName.toLowerCase() === "general" ? focus.subjectName : focus.topicName;
  return (
    <div className="card grid content-start gap-2.5 p-5">
      <h3 className="text-lg font-bold text-slate-800">{weak ? `${label} is wilting` : `Plant ${label}`}</h3>
      <p className="text-sm text-slate-500">
        {weak
          ? `Accuracy is ${focus.accuracy}% in ${focus.subjectName}. A short easy round will bring it back.`
          : `You have not tried it yet in ${focus.subjectName}. A short round is a good way to start.`}
      </p>
      <div>
        <Link to={`/practice?subject=${focus.subjectId}&topic=${focus.topicId}`} className="btn-primary">
          {weak ? "Water it" : "Plant it"}
        </Link>
      </div>
    </div>
  );
}

export function RecentSessionsCard({ sessions }: { sessions: SessionSummary[] }) {
  return (
    <div className="card grid content-start gap-2 p-5">
      <b className="text-sm text-slate-800">Recent sessions</b>
      {sessions.length === 0 ? (
        <p className="text-sm text-slate-500">No sessions yet. Your first one will show up here.</p>
      ) : (
        sessions.slice(0, 5).map((s) => {
          const good = s.xpChange === null || s.xpChange >= 0;
          return (
            <Link
              key={s.sessionId}
              to={`/progress/sessions/${s.sessionId}`}
              className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl bg-slate-200 px-4 py-2.5 transition hover:-translate-y-0.5"
            >
              <span className="min-w-0 text-sm font-semibold text-slate-800">
                {s.sessionType === "DAILY" ? "Daily Session" : "Fast Practice"}
                <span className="block text-xs font-medium text-slate-500">
                  {formatDay(s.completedAt ?? s.startedAt)}
                  {s.status === "ABANDONED" && " · ended early"}
                </span>
              </span>
              <span className="text-right text-sm font-bold text-slate-700">
                {s.accuracy !== null && `${Math.round(Number(s.accuracy))}%`}
                {s.xpChange !== null && (
                  <span className={`block text-xs ${good ? "text-emerald-600" : "text-rose-500"}`}>
                    {s.xpChange >= 0 ? "+" : ""}
                    {s.xpChange} XP
                  </span>
                )}
              </span>
            </Link>
          );
        })
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
