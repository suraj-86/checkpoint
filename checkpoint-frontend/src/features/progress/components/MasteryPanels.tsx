import { Link } from "react-router-dom";
import type { MasteryResponse, MasteryTier, SubjectMastery, TopicMastery } from "../types/progress.types";
import { SHADES, toneFor } from "./treeGeometry";

export const TIER_LABEL: Record<MasteryTier, string> = {
  NOT_STARTED: "Not started",
  STARTED: "Just started",
  NEEDS_WORK: "Needs work",
  GROWING: "Getting there",
  STRONG: "Strong",
};

export function tierFor(answers: number, correct: number): MasteryTier {
  if (answers <= 0) return "NOT_STARTED";
  if (answers < 3) return "STARTED";
  const accuracy = Math.round((correct * 100) / answers);
  if (accuracy >= 80) return "STRONG";
  if (accuracy >= 60) return "GROWING";
  return "NEEDS_WORK";
}


export const ATTENTION: Record<MasteryTier, number> = { NEEDS_WORK: 0, GROWING: 1, STARTED: 2, STRONG: 3, NOT_STARTED: 4 };


export interface StreamGroup {
  id: string;
  name: string;
  subjects: SubjectMastery[];
}

export function buildGroups(
  data: MasteryResponse | undefined,
  streams: { id: string; name: string; subjectIds: string[] }[]
): StreamGroup[] {
  if (!data) return [];
  const bySubject = new Map(data.subjects.map((s) => [s.subjectId, s]));
  const used = new Set<string>();
  const out: StreamGroup[] = [];
  for (const st of streams) {
    const subjects = st.subjectIds.map((id) => bySubject.get(id)).filter((x): x is SubjectMastery => !!x);
    if (subjects.length === 0) continue;
    subjects.forEach((s) => used.add(s.subjectId));
    out.push({ id: st.id, name: st.name, subjects });
  }
  const orphans = data.subjects.filter((s) => !used.has(s.subjectId));
  if (orphans.length > 0) {
    out.push({ id: "__other", name: out.length > 0 ? "Other subjects" : "Everything", subjects: orphans });
  }
  return out;
}

export function sum(subjects: SubjectMastery[], f: (s: SubjectMastery) => number) {
  return subjects.reduce((a, s) => a + f(s), 0);
}


export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <b className="text-slate-800">{value}</b>
    </div>
  );
}

export function AccuracyBar({ value, tone }: { value: number; tone: keyof typeof SHADES }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: SHADES[tone][0] }} />
    </div>
  );
}

export function TierPill({ tier }: { tier: MasteryTier }) {
  const tone = toneFor(tier);
  return (
    <span
      className="inline-block w-fit rounded-full border-2 px-2.5 py-0.5 text-xs font-bold text-slate-800"
      style={{ borderColor: SHADES[tone][0], background: `${SHADES[tone][2]}66` }}
    >
      {TIER_LABEL[tier]}
    </span>
  );
}

export function TopicPanel({ topic }: { topic: TopicMastery }) {
  const tried = topic.answers > 0;
  return (
    <>
      <p className="text-sm font-semibold text-slate-500">{topic.subjectName}</p>
      <h3 className="font-display text-2xl font-bold leading-tight text-slate-800">{topic.topicName}</h3>
      <TierPill tier={topic.tier} />
      <Row label="Accuracy" value={tried ? `${topic.accuracy}%` : "–"} />
      <AccuracyBar value={tried ? topic.accuracy : 0} tone={toneFor(topic.tier)} />
      <Row label="Questions tried" value={`${topic.questionsSeen} of ${topic.activeQuestions}`} />
      <Row label="Answers given" value={`${topic.correct} correct of ${topic.answers}`} />
      <Row label="Well remembered" value={String(topic.stableQuestions)} />
      <Link to={`/practice?subject=${topic.subjectId}&topic=${topic.topicId}`} className="btn-primary mt-1 w-full">
        {topic.tier === "NEEDS_WORK" ? "Water this topic" : "Practise this topic"}
      </Link>
    </>
  );
}

export function SubjectPanel({ subject, onPick }: { subject: SubjectMastery; onPick: (id: string) => void }) {
  const tier = tierFor(subject.answers, subject.correct);
  const tried = subject.answers > 0;
  const insight = subject.topics.filter((t) => t.answers > 0).sort((a, b) => a.accuracy - b.accuracy)[0];
  return (
    <>
      <p className="text-sm font-semibold text-slate-500">Subject</p>
      <h3 className="font-display text-2xl font-bold leading-tight text-slate-800">{subject.subjectName}</h3>
      <TierPill tier={tier} />
      <Row label="Accuracy" value={tried ? `${subject.accuracy}%` : "–"} />
      <AccuracyBar value={tried ? subject.accuracy : 0} tone={toneFor(tier)} />
      <Row label="Questions tried" value={`${subject.questionsSeen} of ${subject.activeQuestions}`} />
      <Row label="Answers given" value={`${subject.correct} correct of ${subject.answers}`} />
      {subject.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {subject.topics.map((t) => (
            <button
              key={t.topicId}
              onClick={() => onPick(t.topicId)}
              className="rounded-full border-2 border-slate-300 bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-700 transition hover:border-indigo-400"
            >
              {t.topicName}
            </button>
          ))}
        </div>
      )}
      {insight && (
        <div className="rounded-2xl bg-slate-200 p-3">
          <b className="text-sm text-slate-800">Coach insight</b>
          <p className="mt-1 text-sm text-slate-500">
            {insight.tier === "NEEDS_WORK"
              ? `Your weakest topic here is ${insight.topicName} at ${insight.accuracy}%. A short easy round there lifts ${subject.subjectName} fastest.`
              : `${insight.topicName} is the topic to keep an eye on here (${insight.accuracy}%). Keep going to lift ${subject.subjectName}.`}
          </p>
        </div>
      )}
      <Link to={`/practice?subject=${subject.subjectId}`} className="btn-primary mt-1 w-full">
        Practise this subject
      </Link>
    </>
  );
}

export function StreamPanel({
  name,
  subjects,
  tier,
  answers,
  correct,
  onPick,
}: {
  name: string;
  subjects: SubjectMastery[];
  tier: MasteryTier;
  answers: number;
  correct: number;
  onPick: (id: string) => void;
}) {
  const accuracy = answers === 0 ? 0 : Math.round((correct * 100) / answers);
  const weakest = subjects
    .filter((s) => s.answers > 0)
    .sort((a, b) => a.accuracy - b.accuracy)[0];
  return (
    <>
      <p className="text-sm font-semibold text-slate-500">Stream</p>
      <h3 className="font-display text-2xl font-bold leading-tight text-slate-800">{name}</h3>
      <TierPill tier={tier} />
      <Row label="Accuracy" value={answers > 0 ? `${accuracy}%` : "–"} />
      <AccuracyBar value={accuracy} tone={toneFor(tier)} />
      <Row label="Subjects" value={String(subjects.length)} />
      <Row label="Answers given" value={`${correct} correct of ${answers}`} />
      {weakest && (
        <p className="text-sm text-slate-500">
          Needs the most care:{" "}
          <button onClick={() => onPick(weakest.subjectId)} className="font-bold text-indigo-600 underline">
            {weakest.subjectName}
          </button>{" "}
          ({weakest.accuracy}%)
        </p>
      )}
      <p className="text-sm text-slate-500">Select a branch or a leaf on the tree to see its analysis.</p>
    </>
  );
}
