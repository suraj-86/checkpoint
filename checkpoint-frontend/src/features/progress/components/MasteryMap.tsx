import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronRight } from "lucide-react";
import { primaryButton } from "../../../components/ui/styles";
import { getMastery } from "../api/progressApi";
import { useStudentCatalog } from "../../catalog/hooks/useStudentCatalog";
import type { MasteryResponse, MasteryTier, TopicMastery } from "../types/progress.types";

const TIERS: Record<MasteryTier, { label: string; tile: string; bar: string; chip: string }> = {
  NOT_STARTED: {
    label: "Not started",
    tile: "border-dashed border-slate-200 bg-white/50",
    bar: "bg-slate-300",
    chip: "bg-slate-100 text-slate-600",
  },
  STARTED: {
    label: "Just started",
    tile: "border-sky-200 bg-sky-50/60",
    bar: "bg-sky-400",
    chip: "bg-sky-100 text-sky-700",
  },
  NEEDS_WORK: {
    label: "Needs work",
    tile: "border-rose-200 bg-rose-50/60",
    bar: "bg-rose-400",
    chip: "bg-rose-100 text-rose-700",
  },
  GROWING: {
    label: "Getting there",
    tile: "border-amber-200 bg-amber-50/60",
    bar: "bg-amber-400",
    chip: "bg-amber-100 text-amber-700",
  },
  STRONG: {
    label: "Strong",
    tile: "border-emerald-200 bg-emerald-50/60",
    bar: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-700",
  },
};

const TIER_ORDER: MasteryTier[] = ["NEEDS_WORK", "GROWING", "STRONG", "STARTED", "NOT_STARTED"];

function practiceLink(t: TopicMastery) {
  return `/practice?subject=${t.subjectId}&topic=${t.topicId}`;
}

function Tile({ topic }: { topic: TopicMastery }) {
  const tier = TIERS[topic.tier];
  const tried = topic.tier !== "NOT_STARTED";
  return (
    <Link
      to={practiceLink(topic)}
      className={`group block rounded-xl border p-3 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/70 ${tier.tile}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">{topic.topicName}</p>
        <ArrowRight size={14} className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
      </div>
      <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${tier.chip}`}>{tier.label}</span>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/80">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${tier.bar}`}
          style={{ width: `${tried ? Math.max(4, topic.accuracy) : 0}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        {tried
          ? `${topic.accuracy}% correct · ${topic.questionsSeen} of ${topic.activeQuestions} questions tried`
          : `${topic.activeQuestions} questions waiting`}
      </p>
    </Link>
  );
}

const TIER_COLOR: Record<MasteryTier, string> = {
  NOT_STARTED: "#cbd5e1",
  STARTED: "#38bdf8",
  NEEDS_WORK: "#fb7185",
  GROWING: "#fbbf24",
  STRONG: "#10b981",
};

type NodeKind = "root" | "stream" | "subject" | "topic";

interface MapNode {
  id: string;
  kind: NodeKind;
  name: string;
  activeQuestions: number;
  questionsSeen: number;
  answers: number;
  correct: number;
  accuracy: number;
  stable: number;
  tier: MasteryTier;
  practice: string | null;
  children: MapNode[];
}

function tierFor(answers: number, correct: number): MasteryTier {
  if (answers <= 0) return "NOT_STARTED";
  if (answers < 3) return "STARTED";
  const accuracy = Math.round((correct * 100) / answers);
  if (accuracy >= 80) return "STRONG";
  if (accuracy >= 60) return "GROWING";
  return "NEEDS_WORK";
}

function group(id: string, kind: NodeKind, name: string, children: MapNode[], practice: string | null): MapNode {
  const sum = (f: (n: MapNode) => number) => children.reduce((a, n) => a + f(n), 0);
  const answers = sum((n) => n.answers);
  const correct = sum((n) => n.correct);
  return {
    id,
    kind,
    name,
    activeQuestions: sum((n) => n.activeQuestions),
    questionsSeen: sum((n) => n.questionsSeen),
    answers,
    correct,
    accuracy: answers === 0 ? 0 : Math.round((correct * 100) / answers),
    stable: sum((n) => n.stable),
    tier: tierFor(answers, correct),
    practice,
    children,
  };
}

function buildTree(data: MasteryResponse, streams: { id: string; name: string; subjectIds: string[] }[]): MapNode {
  const subjects = data.subjects.map((s) =>
    group(
      s.subjectId,
      "subject",
      s.subjectName,
      s.topics.map((t) => ({
        id: t.topicId,
        kind: "topic" as const,
        name: t.topicName,
        activeQuestions: t.activeQuestions,
        questionsSeen: t.questionsSeen,
        answers: t.answers,
        correct: t.correct,
        accuracy: t.accuracy,
        stable: t.stableQuestions,
        tier: t.tier,
        practice: practiceLink(t),
        children: [],
      })),
      `/practice?subject=${s.subjectId}`
    )
  );
  const bySubject = new Map(subjects.map((s) => [s.id, s]));

  const streamNodes: MapNode[] = [];
  const used = new Set<string>();
  for (const st of streams) {
    const kids = st.subjectIds.map((id) => bySubject.get(id)).filter((x): x is MapNode => !!x);
    if (kids.length === 0) continue;
    kids.forEach((k) => used.add(k.id));
    streamNodes.push(group(st.id, "stream", st.name, kids, `/practice?stream=${st.id}`));
  }
  const orphans = subjects.filter((s) => !used.has(s.id));
  if (orphans.length > 0 && streamNodes.length > 0) {
    streamNodes.push(group("__other", "stream", "Other subjects", orphans, null));
  }
  const top = streamNodes.length > 0 ? streamNodes : subjects;
  return group("__root", "root", "Everything", top, null);
}

const COLS = 4;
const W = 800;
const ROW_H = 175;
const R = 30;
const HUB_R = 38;
const HUB_Y = 60;
const FIRST_ROW_Y = 215;

function short(name: string) {
  return name.length > 16 ? `${name.slice(0, 15)}…` : name;
}

function childLabel(n: MapNode) {
  if (n.kind === "stream") return `${n.children.length} subject${n.children.length === 1 ? "" : "s"}`;
  if (n.kind === "subject") return `${n.children.length} topic${n.children.length === 1 ? "" : "s"}`;
  return "";
}

function Ring({
  node,
  x,
  y,
  r,
  selected,
  faded,
  label,
  onClick,
}: {
  node: MapNode;
  x: number;
  y: number;
  r: number;
  selected: boolean;
  faded: boolean;
  label: boolean;
  onClick: () => void;
}) {
  const color = TIER_COLOR[node.tier];
  const circumference = 2 * Math.PI * r;
  const coverage = node.activeQuestions === 0 ? 0 : Math.min(1, node.questionsSeen / node.activeQuestions);
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${node.name}, ${TIERS[node.tier].label}`}
      aria-pressed={selected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer outline-none"
      style={{ opacity: faded ? 0.25 : 1, transition: "opacity 0.2s" }}
    >
      {node.tier === "NEEDS_WORK" && <circle cx={x} cy={y} r={r + 8} fill="none" stroke={color} strokeWidth={2} className="node-pulse" />}
      {selected && <circle cx={x} cy={y} r={r + 10} fill="none" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" />}
      <circle cx={x} cy={y} r={r} fill="white" stroke="#e2e8f0" strokeWidth={6} />
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${circumference * coverage} ${circumference}`}
        transform={`rotate(-90 ${x} ${y})`}
        style={{ transition: "stroke-dasharray 0.7s ease-out" }}
      />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={14} fontWeight={600} fill="#334155">
        {node.answers === 0 ? "–" : node.accuracy}
      </text>
      {label && (
        <>
          <text x={x} y={y + r + 22} textAnchor="middle" fontSize={13} fontWeight={500} fill="#334155">
            {short(node.name)}
          </text>
          {childLabel(node) && (
            <text x={x} y={y + r + 38} textAnchor="middle" fontSize={11} fill="#94a3b8">
              {childLabel(node)}
            </text>
          )}
        </>
      )}
    </g>
  );
}

function NodeGraph({
  hub,
  selectedId,
  onPick,
  dim,
}: {
  hub: MapNode;
  selectedId: string;
  onPick: (n: MapNode) => void;
  dim: MasteryTier | "";
}) {
  const kids = hub.children;
  const cols = Math.min(COLS, Math.max(1, kids.length));
  const step = W / (cols + 1);
  const rows = Math.ceil(kids.length / cols);
  const height = FIRST_ROW_Y + (rows - 1) * ROW_H + 80;
  const pos = kids.map((_, i) => ({
    x: step * ((i % cols) + 1),
    y: FIRST_ROW_Y + Math.floor(i / cols) * ROW_H + (i % 2 === 0 ? 0 : 20),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="group" aria-label={`${hub.name} breakdown`}>
      {pos.map((p, i) => (
        <path
          key={kids[i].id}
          d={`M ${W / 2} ${HUB_Y + HUB_R} C ${W / 2} ${(HUB_Y + p.y) / 2 + 30}, ${p.x} ${(HUB_Y + p.y) / 2 - 10}, ${p.x} ${p.y - R - 4}`}
          fill="none"
          stroke="#c7d2fe"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.8}
        />
      ))}
      <Ring node={hub} x={W / 2} y={HUB_Y} r={HUB_R} selected={false} faded={false} label={false} onClick={() => undefined} />
      <text x={W / 2} y={HUB_Y + HUB_R + 22} textAnchor="middle" fontSize={14} fontWeight={600} fill="#1e293b">
        {short(hub.name)}
      </text>
      {kids.map((k, i) => (
        <Ring
          key={k.id}
          node={k}
          x={pos[i].x}
          y={pos[i].y}
          r={R}
          selected={k.id === selectedId}
          faded={dim !== "" && k.tier !== dim}
          label
          onClick={() => onPick(k)}
        />
      ))}
    </svg>
  );
}

const KIND_LABEL: Record<NodeKind, string> = { root: "Overview", stream: "Stream", subject: "Subject", topic: "Topic" };

function Detail({ node }: { node: MapNode }) {
  const tier = TIERS[node.tier];
  const tried = node.answers > 0;
  const counts = new Map<MasteryTier, number>();
  node.children.forEach((c) => counts.set(c.tier, (counts.get(c.tier) ?? 0) + 1));
  const weakest = node.children
    .filter((c) => c.tier === "NEEDS_WORK")
    .sort((a, b) => a.accuracy - b.accuracy)[0];
  const childWord = node.kind === "stream" ? "subjects" : node.kind === "subject" ? "topics" : "items";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white/70 p-5">
      <p className="text-xs text-slate-400">{KIND_LABEL[node.kind]}</p>
      <h3 className="mt-0.5 text-lg font-semibold text-slate-800">{node.name}</h3>
      <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tier.chip}`}>{tier.label}</span>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Accuracy</dt>
          <dd className="font-medium text-slate-800">{tried ? `${node.accuracy}%` : "–"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Questions tried</dt>
          <dd className="font-medium text-slate-800">
            {node.questionsSeen} of {node.activeQuestions}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Answers given</dt>
          <dd className="font-medium text-slate-800">
            {node.correct} correct of {node.answers}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Well remembered</dt>
          <dd className="font-medium text-slate-800">{node.stable}</dd>
        </div>
      </dl>

      {node.children.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500">
            {node.children.length} {childWord}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TIER_ORDER.filter((t) => counts.get(t)).map((t) => (
              <span key={t} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TIERS[t].chip}`}>
                {counts.get(t)} {TIERS[t].label.toLowerCase()}
              </span>
            ))}
          </div>
          {weakest && (
            <p className="mt-2 text-xs text-slate-500">
              Weakest: <span className="font-medium text-slate-700">{weakest.name}</span> ({weakest.accuracy}%)
            </p>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500">
        {node.tier === "NOT_STARTED"
          ? "Nothing tried here yet. A short session is a good start."
          : node.tier === "NEEDS_WORK"
            ? "This needs attention. A short session will help it stick."
            : node.tier === "STRONG"
              ? "Looking strong. Keep it fresh with the occasional review."
              : "Keep going. The ring fills as you try more questions."}
      </p>
      {node.practice && (
        <Link to={node.practice} className={`${primaryButton} mt-4 inline-flex items-center gap-2`}>
          Practise {node.kind === "topic" ? "this topic" : "this " + node.kind} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

export function MasteryMap() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["progress-mastery"], queryFn: getMastery });
  const { data: catalog } = useStudentCatalog();
  const [pathIds, setPathIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [tierFilter, setTierFilter] = useState<MasteryTier | "">("");

  const root = useMemo(() => (data ? buildTree(data, catalog?.streams ?? []) : null), [data, catalog]);

  if (isLoading) {
    return (
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700">Mastery map</h2>
        <p className="mt-3 text-sm text-slate-400">Loading...</p>
      </div>
    );
  }
  if (isError || !data || !root) {
    return (
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700">Mastery map</h2>
        <p className="mt-3 text-sm text-red-600">Could not load your mastery map. Try refreshing.</p>
      </div>
    );
  }

  const trail: MapNode[] = [];
  let hub = root;
  for (const id of pathIds) {
    const next = hub.children.find((c) => c.id === id);
    if (!next) break;
    trail.push(next);
    hub = next;
  }
  const selected = hub.children.find((c) => c.id === selectedId) ?? null;
  const panelNode = selected ?? hub;

  const counts = new Map<MasteryTier, number>();
  hub.children.forEach((c) => counts.set(c.tier, (counts.get(c.tier) ?? 0) + 1));

  function pick(n: MapNode) {
    setTierFilter("");
    if (n.children.length > 0) {
      setPathIds([...trail.map((t) => t.id), n.id]);
      setSelectedId("");
    } else {
      setSelectedId(n.id);
    }
  }

  function goTo(depth: number) {
    setPathIds(trail.slice(0, depth).map((t) => t.id));
    setSelectedId("");
    setTierFilter("");
  }

  return (
    <div className="space-y-6">
      {data.weakest.length > 0 && (
        <div className="card border-rose-100 p-5">
          <h2 className="text-sm font-semibold text-slate-700">Focus on these next</h2>
          <p className="text-xs text-slate-500">Your lowest-scoring topics. A short session here moves the needle most.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {data.weakest.map((t) => (
              <div key={t.topicId}>
                <p className="mb-1 text-xs text-slate-400">{t.subjectName}</p>
                <Tile topic={t} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700">Mastery map</h2>
        <p className="text-xs text-slate-500">
          Tap a node to see its analysis and open what is inside it. The ring shows how much you have tried, the colour how well you know it.
        </p>

        {root.children.length === 0 ? (
          <p className="mt-5 text-sm text-slate-400">No topics are available yet.</p>
        ) : (
          <>
            <nav className="mt-4 flex flex-wrap items-center gap-1 text-sm" aria-label="Map location">
              <button
                type="button"
                onClick={() => goTo(0)}
                className={`rounded-lg px-2 py-1 transition hover:bg-indigo-50 ${trail.length === 0 ? "font-semibold text-slate-800" : "text-indigo-600"}`}
              >
                All
              </button>
              {trail.map((t, i) => (
                <span key={t.id} className="flex items-center gap-1">
                  <ChevronRight size={14} className="text-slate-300" />
                  <button
                    type="button"
                    onClick={() => goTo(i + 1)}
                    className={`rounded-lg px-2 py-1 transition hover:bg-indigo-50 ${
                      i === trail.length - 1 ? "font-semibold text-slate-800" : "text-indigo-600"
                    }`}
                  >
                    {t.name}
                  </button>
                </span>
              ))}
            </nav>

            <div className="mt-3 grid gap-5 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-white/60 p-3 lg:col-span-2">
                <NodeGraph hub={hub} selectedId={selected?.id ?? ""} onPick={pick} dim={tierFilter} />
                <div className="mt-2 flex flex-wrap gap-2 px-1 pb-1">
                  {TIER_ORDER.filter((t) => counts.get(t)).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setTierFilter(tierFilter === t ? "" : t)}
                      aria-pressed={tierFilter === t}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                        tierFilter === t ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-transparent text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: TIER_COLOR[t] }} />
                      {TIERS[t].label} ({counts.get(t)})
                    </button>
                  ))}
                </div>
              </div>
              <Detail node={panelNode} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
