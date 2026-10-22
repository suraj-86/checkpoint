import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, Gift, Sprout, TrendingDown, TrendingUp } from "lucide-react";
import { completeSession } from "../api/practiceApi";
import { messageFromError } from "../../admin/utils/format";
import { getMastery, getSessionDetail } from "../../progress/api/progressApi";
import type { MasteryTier } from "../../progress/types/progress.types";
import { Mascot, type MascotMood } from "../../../components/mascot/Mascot";
import { Chip, type ChipTone } from "../../../components/ui/Chip";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useCountUp } from "../../../lib/useCountUp";
import { playSound } from "../../../lib/sound";
import { ChestIcon, tierLabel } from "../../rewards/components/ChestIcon";
import { useEquippedSkin } from "../../rewards/hooks/useRewards";
import type { PerformanceBand, SessionCompletion } from "../types/practice.types";

const BAND_LABEL: Record<PerformanceBand, string> = {
  EXCELLENT: "Excellent",
  GOOD: "Good",
  FAIR: "Fair",
  WEAK: "Weak",
  POOR: "Poor",
};

const TIER_LABEL: Record<MasteryTier, string> = {
  NOT_STARTED: "Not started",
  STARTED: "Just started",
  NEEDS_WORK: "Needs work",
  GROWING: "Growing",
  STRONG: "Strong",
};

const TIER_TONE: Record<MasteryTier, ChipTone> = {
  NOT_STARTED: "neutral",
  STARTED: "neutral",
  NEEDS_WORK: "bad",
  GROWING: "warn",
  STRONG: "good",
};

const RESULT_LINES: Record<MascotMood, string> = {
  idle: "Session done.",
  happy: "Nice work!",
  hype: "Great focus!",
  sleepy: "That is a wrap.",
  oops: "Shake it off. Next one.",
  proud: "Excellent session. I am so proud.",
};

function moodFor(result: SessionCompletion): MascotMood {
  if (result.leveledUp) return "proud";
  switch (result.performanceBand) {
    case "EXCELLENT":
      return "proud";
    case "GOOD":
      return "happy";
    case "WEAK":
    case "POOR":
      return "oops";
    default:
      return result.xpChange >= 0 ? "happy" : "oops";
  }
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className={`font-extrabold ${tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-rose-600" : "text-slate-800"}`}>
        {value}
      </span>
    </div>
  );
}

const signed = (n: number) => `${n > 0 ? "+" : ""}${n}`;

function WhatMoved({ sessionId }: { sessionId: string }) {
  const { data: detail } = useQuery({ queryKey: ["session-detail", sessionId], queryFn: () => getSessionDetail(sessionId) });
  const { data: mastery } = useQuery({ queryKey: ["progress-mastery"], queryFn: getMastery });

  const rows = useMemo(() => {
    if (!detail || !mastery) return [];
    const byId = new Map<string, { tier: MasteryTier; accuracy: number }>();
    mastery.subjects.forEach((s) => s.topics.forEach((t) => byId.set(t.topicId, { tier: t.tier, accuracy: t.accuracy })));
    const perTopic = new Map<string, { label: string; correct: number; total: number }>();
    detail.questions
      .filter((x) => x.status !== "UNANSWERED")
      .forEach((x) => {
        const label = x.subject && x.subject !== x.topic ? `${x.subject}: ${x.topic}` : x.topic;
        const cur = perTopic.get(x.topicId) ?? { label, correct: 0, total: 0 };
        cur.total += 1;
        if (x.status === "CORRECT") cur.correct += 1;
        perTopic.set(x.topicId, cur);
      });
    return [...perTopic.entries()]
      .map(([topicId, c]) => ({ topic: c.label, key: topicId, correct: c.correct, total: c.total, now: byId.get(topicId) }))
      .sort((a, b) => b.total - a.total);
  }, [detail, mastery]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-slate-800">
          <Sprout size={18} className="text-emerald-600" /> What moved in your garden
        </h2>
        <Link to="/progress" className="text-sm font-bold text-indigo-600 hover:underline">
          Open mastery map
        </Link>
      </div>
      {!detail || !mastery ? (
        <p className="mt-3 text-sm text-slate-500">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No answered questions to show.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {rows.map((r) => (
            <li key={r.key}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-extrabold text-slate-800">{r.topic}</span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500">
                    {r.correct}/{r.total} this session
                  </span>
                  {r.now && <Chip tone={TIER_TONE[r.now.tier]}>{TIER_LABEL[r.now.tier]}</Chip>}
                </span>
              </div>
              {r.now && (
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar value={r.now.accuracy} tone={r.now.tier === "STRONG" ? "good" : "pri"} label={`${r.topic} accuracy`} />
                  </div>
                  <span className="w-24 text-right text-xs font-bold text-slate-500">{r.now.accuracy}% overall</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const resultKey = (id: string) => `checkpoint_result_${id}`;

function readSavedResult(id: string | undefined): SessionCompletion | null {
  if (!id) return null;
  try {
    const raw = sessionStorage.getItem(resultKey(id));
    return raw ? (JSON.parse(raw) as SessionCompletion) : null;
  } catch {
    return null;
  }
}

function saveResult(id: string, value: SessionCompletion) {
  try {
    sessionStorage.setItem(resultKey(id), JSON.stringify(value));
  } catch {
    /* storage unavailable: the page still works for this visit */
  }
}

export function SessionResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const queryClient = useQueryClient();
  const hasRequested = useRef(false);
  const skin = useEquippedSkin();
  // Opening "Review answers" and coming back must not complete the session twice.
  const [saved] = useState(() => readSavedResult(sessionId));

  const completeMutation = useMutation({
    mutationFn: () => completeSession(sessionId!),
    onSuccess: (data) => {
      if (sessionId) saveResult(sessionId, data);
      playSound(data.leveledUp ? "levelup" : "done");
      queryClient.removeQueries({ queryKey: ["active-session"] });
      for (const key of ["dashboard", "profile", "progress-overall", "progress-mastery", "progress-activity", "progress-sessions", "rewards"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });

  useEffect(() => {
    if (sessionId && !saved && !hasRequested.current) {
      hasRequested.current = true;
      completeMutation.mutate();
    }
  }, [sessionId]);

  const result = completeMutation.data ?? saved ?? undefined;
  const xpShown = useCountUp(Math.abs(result?.xpChange ?? 0));
  const { data: detail } = useQuery({
    queryKey: ["session-detail", sessionId],
    queryFn: () => getSessionDetail(sessionId!),
    enabled: !!sessionId && !!result,
  });
  const isFast = detail?.summary.sessionType === "FAST";

  if (!result && (completeMutation.isPending || completeMutation.isIdle)) {
    return <p className="text-center text-slate-500">Finishing up...</p>;
  }

  if (!result) {
    return (
      <div className="mx-auto max-w-md card p-6 text-center">
        <p className="font-bold text-red-600">{messageFromError(completeMutation.error)}</p>
        <Link to="/home" className="btn-secondary mt-3">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const positive = result.xpChange >= 0;
  const mood = moodFor(result);

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-semibold text-slate-500">Session complete</p>
        <h1 className="font-display text-[clamp(28px,4vw,40px)] font-extrabold leading-tight text-slate-800">
          {result.performanceBand ? `${BAND_LABEL[result.performanceBand]} work` : "Nicely done"}
        </h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="hero-card relative p-6 pr-[130px] sm:pr-[200px]">
          <Mascot skin={skin} mood={mood} size={150} className="absolute bottom-3 right-3 hidden sm:block" />
          <Mascot skin={skin} mood={mood} size={90} className="absolute bottom-3 right-3 sm:hidden" />
          <p className="text-sm font-bold text-white/95">{result.leveledUp ? "Level up! I am so proud." : RESULT_LINES[mood]}</p>
          <div className="mt-2 flex items-center gap-2 font-display text-5xl font-extrabold text-white">
            {positive ? <TrendingUp size={36} /> : <TrendingDown size={36} />}
            {positive ? "+" : "-"}
            {xpShown} XP
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="rounded-2xl bg-white/20 px-4 py-2 text-white">
              <p className="text-xs font-bold text-white/80">Correct</p>
              <p className="text-xl font-extrabold">
                {result.correctCount} / {result.primaryQuestionCount}
              </p>
            </div>
            <div className="rounded-2xl bg-white/20 px-4 py-2 text-white">
              <p className="text-xs font-bold text-white/80">Accuracy</p>
              <p className="text-xl font-extrabold">{result.accuracy != null ? `${result.accuracy}%` : "-"}</p>
            </div>
          </div>
          {result.leveledUp && (
            <p className="mt-4 rounded-2xl bg-amber-300 px-3 py-2 text-sm font-extrabold text-slate-900">
              You leveled up! Level {result.levelBefore} to Level {result.level}.
            </p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-display text-xl font-bold text-slate-800">XP breakdown</h2>
          <div className="mt-2 divide-y divide-slate-200">
            {result.performanceBand && (
              <Row label="Performance" value={`${BAND_LABEL[result.performanceBand]} (${Math.round(result.performancePercent)}%)`} />
            )}
            <Row label="From your answers" value={`${signed(result.sessionXp)} XP`} tone={result.sessionXp >= 0 ? "good" : "bad"} />
            {result.streakMilestoneBonus > 0 && (
              <Row label={`${result.currentStreak}-day streak bonus`} value={`+${result.streakMilestoneBonus} XP`} tone="good" />
            )}
            {result.rewards?.boostApplied && (
              <Row label={`Boost (${result.rewards.boostApplied.label})`} value={`+${result.rewards.boostApplied.bonusXp} XP`} tone="good" />
            )}
            <Row label="Total change" value={`${signed(result.xpChange)} XP`} tone={positive ? "good" : "bad"} />
            <Row label="Total XP" value={`${result.totalXp}`} />
            <Row label="Level" value={result.leveledUp ? `${result.levelBefore} to ${result.level}` : `${result.level}`} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {isFast
              ? "Fast Practice earns a quarter of Daily Session XP, up to 500 XP a day. Your XP never drops below zero."
              : "Your XP never drops below zero."}
          </p>
          {result.currentStreak > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-slate-600">
              <Flame size={15} className="text-orange-500" />
              Current streak: {result.currentStreak} {result.currentStreak === 1 ? "day" : "days"} (best {result.longestStreak})
            </p>
          )}
        </div>
      </div>

      {result.unattemptedCount > 0 && (
        <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
          You answered {result.answeredCount} and left {result.unattemptedCount} unattempted. Unattempted questions count against
          accuracy and XP in a Daily Session. In Fast Practice only your answers are scored, and the rest come back in your next
          sessions.
        </p>
      )}

      {(result.rewards?.chestEarned || result.rewards?.streakChest) && (
        <div className="card flex flex-wrap items-center gap-4 p-5">
          <div className="flex gap-2">
            {result.rewards.chestEarned && <ChestIcon tier={result.rewards.chestEarned.tier} size={64} />}
            {result.rewards.streakChest && <ChestIcon tier={result.rewards.streakChest.tier} size={64} />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-slate-800">
              <Gift size={18} className="text-indigo-500" /> You earned a chest
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {result.rewards.chestEarned && `A ${tierLabel(result.rewards.chestEarned.tier)} chest for this session. `}
              {result.rewards.streakChest &&
                `A ${tierLabel(result.rewards.streakChest.tier)} chest for your ${result.rewards.streakChest.days}-day streak.`}
            </p>
          </div>
          <Link to="/rewards" className="btn-primary">
            Open chest
          </Link>
        </div>
      )}

      {sessionId && <WhatMoved sessionId={sessionId} />}

      <div className="flex flex-wrap gap-3">
        <Link to="/practice" className="btn-primary">
          Practise again
        </Link>
        <Link to={`/progress/sessions/${result.sessionId}`} className="btn-secondary">
          Review answers
        </Link>
        <Link to="/home" className="btn-secondary">
          Back to home
        </Link>
      </div>
    </div>
  );
}
