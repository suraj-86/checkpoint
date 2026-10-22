import { useMemo, useRef, useState, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Sprout } from "lucide-react";
import { getMastery } from "../api/progressApi";
import { useStudentCatalog } from "../../catalog/hooks/useStudentCatalog";
import type { SubjectMastery, TopicMastery } from "../types/progress.types";
import { ATTENTION, StreamPanel, SubjectPanel, TIER_LABEL, TopicPanel, buildGroups, sum, tierFor } from "./MasteryPanels";
import { SHADES, toneFor } from "./treeGeometry";

type Selection = { kind: "stream" } | { kind: "subject"; id: string } | { kind: "topic"; id: string };
type Filter = "all" | "needs";

const W = 900;
const H = 560;
const HUB = { x: 100, y: 280, r: 46 };
const CARD_X = 220;
const CARD_W = 250;
const TOPIC_X = 640;
const TOPIC_W = 235;

const short = (name: string, max: number) => (name.length > max ? `${name.slice(0, max - 1)}…` : name);
const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const mid = (x1 + x2) / 2;
  return `M${x1} ${y1} C${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
};

export function MasteryMap() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["progress-mastery"], queryFn: getMastery });
  const { data: catalog } = useStudentCatalog();
  const [streamId, setStreamId] = useState("");
  const [openSubjectId, setOpenSubjectId] = useState("");
  const [selection, setSelection] = useState<Selection>({ kind: "stream" });
  const [filter, setFilter] = useState<Filter>("all");
  const [vb, setVb] = useState({ x: 0, y: 0, w: W, h: H });
  const drag = useRef<{ px: number; py: number; vx: number; vy: number } | null>(null);

  const groups = useMemo(() => buildGroups(data, catalog?.streams ?? []), [data, catalog]);
  const group = groups.find((g) => g.id === streamId) ?? groups[0];

  if (isLoading) {
    return (
      <div className="card p-5">
        <h2 className="text-sm font-bold text-slate-800">Mastery map</h2>
        <p className="mt-3 text-sm text-slate-500">Loading...</p>
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="card p-5">
        <h2 className="text-sm font-bold text-slate-800">Mastery map</h2>
        <p className="mt-3 text-sm text-red-600">Could not load your mastery map. Try refreshing.</p>
      </div>
    );
  }
  if (!group) {
    return (
      <div className="card p-5">
        <h2 className="text-sm font-bold text-slate-800">Mastery map</h2>
        <p className="mt-3 text-sm text-slate-500">No topics are available yet. Once questions are added, your map grows here.</p>
      </div>
    );
  }

  const allSubjects = group.subjects;
  const subjects = filter === "needs" ? allSubjects.filter((s) => tierFor(s.answers, s.correct) === "NEEDS_WORK") : allSubjects;
  const answers = sum(allSubjects, (s) => s.answers);
  const correct = sum(allSubjects, (s) => s.correct);
  const streamTier = tierFor(answers, correct);
  const streamAccuracy = answers === 0 ? 0 : Math.round((correct * 100) / answers);

  const n = subjects.length;
  const spacing = Math.min(84, 500 / Math.max(n, 1));
  const cardH = Math.max(34, Math.min(60, spacing - 8));
  const compact = cardH < 46;
  const yOf = (i: number) => H / 2 - ((n - 1) * spacing) / 2 + i * spacing;

  const openSubject = subjects.find((s) => s.subjectId === openSubjectId);
  const openIndex = openSubject ? subjects.indexOf(openSubject) : -1;
  const topics: TopicMastery[] = openSubject
    ? [...openSubject.topics].sort((a, b) => ATTENTION[a.tier] - ATTENTION[b.tier] || a.topicName.localeCompare(b.topicName))
    : [];
  const topicSpacing = Math.min(64, 500 / Math.max(topics.length, 1));
  const topicH = Math.max(30, Math.min(46, topicSpacing - 8));
  const topicY = (k: number) => H / 2 - ((topics.length - 1) * topicSpacing) / 2 + k * topicSpacing;

  const subjectById = new Map<string, SubjectMastery>(allSubjects.map((s) => [s.subjectId, s]));
  const topicById = new Map<string, TopicMastery>();
  allSubjects.forEach((s) => s.topics.forEach((t) => topicById.set(t.topicId, t)));

  function pickSubject(id: string) {
    setOpenSubjectId(id);
    setSelection({ kind: "subject", id });
  }

  function zoom(factor: number) {
    setVb((v) => {
      const w = Math.max(320, Math.min(W, v.w * factor));
      const h = (w * H) / W;
      const x = Math.max(0, Math.min(W - w, v.x + (v.w - w) / 2));
      const y = Math.max(0, Math.min(H - h, v.y + (v.h - h) / 2));
      return { x, y, w, h };
    });
  }

  function onPointerDown(e: PointerEvent<SVGSVGElement>) {
    if (vb.w >= W || (e.target as Element).closest("[data-node]")) return;
    drag.current = { px: e.clientX, py: e.clientY, vx: vb.x, vy: vb.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    const d = drag.current;
    if (!d) return;
    const k = vb.w / e.currentTarget.getBoundingClientRect().width;
    setVb((v) => ({
      ...v,
      x: Math.max(0, Math.min(W - v.w, d.vx - (e.clientX - d.px) * k)),
      y: Math.max(0, Math.min(H - v.h, d.vy - (e.clientY - d.py) * k)),
    }));
  }

  const nodeKey = (fn: () => void) => (e: { key: string; preventDefault: () => void }) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

  return (
    <section className="grid grid-cols-1 gap-3" aria-label="Mastery map">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">Pick a subject to fan out its topics</p>
          <h2 className="font-display text-2xl font-bold text-slate-800">Mastery map</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {groups.length > 1 &&
            groups.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setStreamId(g.id);
                  setOpenSubjectId("");
                  setSelection({ kind: "stream" });
                  setVb({ x: 0, y: 0, w: W, h: H });
                }}
                aria-pressed={g.id === group.id}
                className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition ${
                  g.id === group.id
                    ? "border-indigo-500 bg-indigo-500 text-white"
                    : "border-slate-300 bg-slate-100 text-slate-600 hover:border-indigo-400"
                }`}
              >
                {g.name}
              </button>
            ))}
          <Link to="/garden" className="btn-secondary !py-1.5">
            <Sprout size={15} />
            Garden view
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="card relative overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div className="flex gap-2" role="group" aria-label="Filter">
              {(
                [
                  ["all", "All"],
                  ["needs", "Needs work"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => {
                    setFilter(id);
                    setOpenSubjectId("");
                  }}
                  aria-pressed={filter === id}
                  className={`rounded-full border-2 px-4 py-1 text-sm font-bold transition ${
                    filter === id ? "border-amber-400 bg-amber-300 text-slate-900" : "border-slate-300 bg-slate-100 text-slate-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => zoom(1.25)} aria-label="Zoom out" className="btn-secondary !px-3 !py-1">
                <Minus size={14} />
              </button>
              <button onClick={() => setVb({ x: 0, y: 0, w: W, h: H })} className="btn-secondary !px-3 !py-1">
                Reset
              </button>
              <button onClick={() => zoom(0.8)} aria-label="Zoom in" className="btn-secondary !px-3 !py-1">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
          <svg
            viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
            className={`block w-full min-w-[720px] touch-pan-x touch-pan-y select-none lg:min-w-0 ${vb.w < W ? "cursor-grab" : ""}`}
            role="group"
            aria-label={`Mastery map for ${group.name}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
            onPointerLeave={() => (drag.current = null)}
          >
            <defs>
              <radialGradient id="mm-hub" cx="35%" cy="30%">
                <stop offset="0" stopColor="#d9ccff" />
                <stop offset="1" stopColor="#7a58e6" />
              </radialGradient>
            </defs>

            {subjects.map((s, i) => {
              const tone = toneFor(tierFor(s.answers, s.correct));
              const active = s.subjectId === openSubjectId;
              return (
                <path
                  key={`l-${s.subjectId}`}
                  d={curve(HUB.x + HUB.r, HUB.y, CARD_X, yOf(i))}
                  fill="none"
                  stroke={SHADES[tone][0]}
                  strokeWidth={active ? 4 : 2.5}
                  opacity={active ? 1 : 0.65}
                />
              );
            })}

            {openSubject &&
              topics.map((t, k) => (
                <path
                  key={`tl-${t.topicId}`}
                  d={curve(CARD_X + CARD_W, yOf(openIndex), TOPIC_X, topicY(k))}
                  fill="none"
                  stroke={SHADES[toneFor(t.tier)][0]}
                  strokeWidth={2.5}
                  opacity={0.8}
                />
              ))}

            <g
              data-node
              tabIndex={0}
              role="button"
              aria-label={`${group.name} stream`}
              className="cursor-pointer outline-none"
              onClick={() => {
                setOpenSubjectId("");
                setSelection({ kind: "stream" });
              }}
              onKeyDown={nodeKey(() => {
                setOpenSubjectId("");
                setSelection({ kind: "stream" });
              })}
            >
              <circle cx={HUB.x} cy={HUB.y} r={HUB.r + 22} fill="none" stroke="rgb(var(--line))" strokeDasharray="3 5" />
              <circle cx={HUB.x} cy={HUB.y} r={HUB.r} fill="url(#mm-hub)" stroke={selection.kind === "stream" ? "#fff" : "none"} strokeWidth={3} />
              <text x={HUB.x} y={HUB.y + 6} textAnchor="middle" fontSize={17} fontWeight={800} fill="#fff">
                {answers > 0 ? `${streamAccuracy}%` : "–"}
              </text>
              <text x={HUB.x} y={HUB.y + HUB.r + 40} textAnchor="middle" fontSize={14} fontWeight={800} style={{ fill: "rgb(var(--ink))" }}>
                {short(group.name, 20)}
              </text>
              <text x={HUB.x} y={HUB.y + HUB.r + 56} textAnchor="middle" fontSize={11} style={{ fill: "rgb(var(--ink) / 0.65)" }}>
                stream mastery
              </text>
            </g>

            {subjects.map((s, i) => {
              const tier = tierFor(s.answers, s.correct);
              const tone = toneFor(tier);
              const y = yOf(i);
              const active = s.subjectId === openSubjectId;
              const started = s.answers > 0;
              return (
                <g
                  key={s.subjectId}
                  data-node
                  tabIndex={0}
                  role="button"
                  aria-label={`${s.subjectName}, ${TIER_LABEL[tier]}`}
                  aria-pressed={active}
                  className="cursor-pointer outline-none"
                  onClick={() => pickSubject(s.subjectId)}
                  onKeyDown={nodeKey(() => pickSubject(s.subjectId))}
                >
                  <rect
                    x={CARD_X}
                    y={y - cardH / 2}
                    width={CARD_W}
                    height={cardH}
                    rx={16}
                    strokeWidth={active ? 3 : 2}
                    strokeDasharray={started ? undefined : "5 4"}
                    style={{ fill: "rgb(var(--panel))", stroke: active ? "#8b6cf0" : SHADES[tone][0] }}
                  />
                  <rect x={CARD_X + 8} y={y - cardH / 2 + 8} width={5} height={cardH - 16} rx={2.5} fill={SHADES[tone][0]} />
                  <text
                    x={CARD_X + 24}
                    y={compact ? y + 5 : y + 2}
                    fontSize={compact ? 15 : 22}
                    fontWeight={800}
                    style={{ fill: "rgb(var(--ink))" }}
                  >
                    {started ? `${s.accuracy}%` : "–"}
                  </text>
                  {!compact && (
                    <text x={CARD_X + 24} y={y + 19} fontSize={12} style={{ fill: "rgb(var(--ink) / 0.7)" }}>
                      {short(s.subjectName, 16)}
                    </text>
                  )}
                  {compact && (
                    <text x={CARD_X + 74} y={y + 5} fontSize={12} fontWeight={700} style={{ fill: "rgb(var(--ink))" }}>
                      {short(s.subjectName, 20)}
                    </text>
                  )}
                  <text x={CARD_X + CARD_W - 12} y={y - (compact ? -4 : 6)} textAnchor="end" fontSize={11} style={{ fill: "rgb(var(--ink) / 0.65)" }}>
                    {compact ? s.topics.length : `${s.topics.length} ${s.topics.length === 1 ? "topic" : "topics"}`}
                  </text>
                  {!compact && tier === "NEEDS_WORK" && (
                    <text x={CARD_X + CARD_W - 12} y={y + 19} textAnchor="end" fontSize={11} fontWeight={800} fill="#d6558a">
                      needs work
                    </text>
                  )}
                </g>
              );
            })}

            {openSubject &&
              topics.map((t, k) => {
                const tone = toneFor(t.tier);
                const y = topicY(k);
                const picked = selection.kind === "topic" && selection.id === t.topicId;
                const started = t.answers > 0;
                return (
                  <g
                    key={t.topicId}
                    data-node
                    tabIndex={0}
                    role="button"
                    aria-label={`${t.topicName}, ${TIER_LABEL[t.tier]}`}
                    className="cursor-pointer outline-none"
                    onClick={() => setSelection({ kind: "topic", id: t.topicId })}
                    onKeyDown={nodeKey(() => setSelection({ kind: "topic", id: t.topicId }))}
                  >
                    <rect
                      x={TOPIC_X}
                      y={y - topicH / 2}
                      width={TOPIC_W}
                      height={topicH}
                      rx={topicH / 2}
                      strokeWidth={picked ? 3 : 2}
                      strokeDasharray={started ? undefined : "5 4"}
                      style={{ fill: "rgb(var(--panel))", stroke: picked ? "#8b6cf0" : SHADES[tone][0] }}
                    />
                    <circle cx={TOPIC_X + 18} cy={y} r={6} fill={SHADES[tone][1]} />
                    <text x={TOPIC_X + 32} y={y + 4} fontSize={13} fontWeight={800} style={{ fill: "rgb(var(--ink))" }}>
                      {short(t.topicName, 20)}
                    </text>
                    <text x={TOPIC_X + TOPIC_W - 16} y={y + 4} textAnchor="end" fontSize={13} fontWeight={800} style={{ fill: "rgb(var(--ink))" }}>
                      {started ? `${t.accuracy}%` : "–"}
                    </text>
                  </g>
                );
              })}

            {n === 0 && (
              <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={16} style={{ fill: "rgb(var(--ink) / 0.7)" }}>
                No subjects need work right now. Nice.
              </text>
            )}
          </svg>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 pb-3 text-[13px] font-semibold text-slate-500">
            {(["strong", "gold", "rose", "idle"] as const).map((tone) => (
              <span key={tone} className="flex items-center gap-1.5">
                <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SHADES[tone][1] }} />
                {tone === "strong" ? "Strong" : tone === "gold" ? "Getting there" : tone === "rose" ? "Needs work" : "Not started or just started"}
              </span>
            ))}
            <span>Dashed means not tried yet. Zoom in, then drag to move.</span>
          </div>
        </div>

        <aside className="card grid content-start gap-3 p-5" aria-live="polite">
          {selection.kind === "topic" && topicById.get(selection.id) ? (
            <TopicPanel topic={topicById.get(selection.id)!} />
          ) : selection.kind === "subject" && subjectById.get(selection.id) ? (
            <SubjectPanel subject={subjectById.get(selection.id)!} onPick={(id) => setSelection({ kind: "topic", id })} />
          ) : (
            <StreamPanel
              name={group.name}
              subjects={allSubjects}
              tier={streamTier}
              answers={answers}
              correct={correct}
              onPick={pickSubject}
            />
          )}
        </aside>
      </div>
    </section>
  );
}
