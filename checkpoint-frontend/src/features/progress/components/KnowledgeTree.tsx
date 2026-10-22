import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMastery } from "../api/progressApi";
import { useStudentCatalog } from "../../catalog/hooks/useStudentCatalog";
import type {TopicMastery } from "../types/progress.types";
import { LEAF_PATH, SHADES, layoutTree, type TreeSubject } from "./treeGeometry";
import {
  ATTENTION,
  StreamPanel,
  SubjectPanel,
  TIER_LABEL,
  TopicPanel,
  buildGroups,
  sum,
  tierFor,
} from "./MasteryPanels";

type Selection = { kind: "stream" } | { kind: "subject"; id: string } | { kind: "topic"; id: string };

export function KnowledgeTree() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["progress-mastery"], queryFn: getMastery });
  const { data: catalog } = useStudentCatalog();
  const [streamId, setStreamId] = useState("");
  const [selection, setSelection] = useState<Selection>({ kind: "stream" });

  const groups = useMemo(() => buildGroups(data, catalog?.streams ?? []), [data, catalog]);

  const group = groups.find((g) => g.id === streamId) ?? groups[0];

  useEffect(() => {
    setSelection({ kind: "stream" });
  }, [group?.id]);

  const layout = useMemo(() => {
    if (!group) return null;
    const subjects: TreeSubject[] = group.subjects.map((s) => {
      const ordered = [...s.topics].sort((a, b) => ATTENTION[a.tier] - ATTENTION[b.tier] || a.topicName.localeCompare(b.topicName));
      return {
        id: s.subjectId,
        name: s.subjectName,
        accuracy: s.accuracy,
        tier: tierFor(s.answers, s.correct),
        topics: ordered.slice(0, 3).map((t) => ({ id: t.topicId, name: t.topicName, accuracy: t.accuracy, tier: t.tier })),
        hiddenTopics: Math.max(0, ordered.length - 3),
      };
    });
    return layoutTree(subjects);
  }, [group]);

  if (isLoading) {
    return (
      <div className="card p-5">
        <h2 className="text-sm font-bold text-slate-800">Knowledge tree</h2>
        <p className="mt-3 text-sm text-slate-500">Loading...</p>
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="card p-5">
        <h2 className="text-sm font-bold text-slate-800">Knowledge tree</h2>
        <p className="mt-3 text-sm text-red-600">Could not load your knowledge tree. Try refreshing.</p>
      </div>
    );
  }
  if (!group || !layout) {
    return (
      <div className="card p-5">
        <h2 className="text-sm font-bold text-slate-800">Knowledge tree</h2>
        <p className="mt-3 text-sm text-slate-500">No topics are available yet. Once questions are added, your tree grows here.</p>
      </div>
    );
  }

  const topicById = new Map<string, TopicMastery>();
  group.subjects.forEach((s) => s.topics.forEach((t) => topicById.set(t.topicId, t)));
  const subjectById = new Map(group.subjects.map((s) => [s.subjectId, s]));

  const activate = (sel: Selection) => (e?: { key?: string; preventDefault: () => void }) => {
    if (e && e.key !== undefined && e.key !== "Enter" && e.key !== " ") return;
    e?.preventDefault();
    setSelection(sel);
  };

  const streamAnswers = sum(group.subjects, (s) => s.answers);
  const streamCorrect = sum(group.subjects, (s) => s.correct);
  const streamTier = tierFor(streamAnswers, streamCorrect);

  return (
    <section className="grid gap-3" aria-label="Knowledge tree">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">Roots are the stream, branches are subjects, leaves are topics</p>
          <h2 className="font-display text-2xl font-bold text-slate-800">{group.name}</h2>
        </div>
        {groups.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Stream">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setStreamId(g.id)}
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
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="card overflow-hidden p-2">
          <svg
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            className="block w-full"
            role="group"
            aria-label={`Knowledge tree for ${group.name}`}
          >
            <defs>
              <linearGradient id="kt-bark" x1="0" x2="1">
                <stop offset="0" stopColor="#a384b8" />
                <stop offset=".55" stopColor="#7f5f9b" />
                <stop offset="1" stopColor="#5f4380" />
              </linearGradient>
              <linearGradient id="kt-soil" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#75599a" />
                <stop offset="1" stopColor="#4f3a72" />
              </linearGradient>
            </defs>

            {layout.halos.map((h, i) => (
              <ellipse key={i} cx={h.x} cy={h.y} rx={h.rx} ry={h.ry} fill={SHADES[h.tone][1]} opacity={0.2} />
            ))}

            <rect x={layout.groundLeft} y={500} width={layout.groundWidth} height={54} rx={22} fill="url(#kt-soil)" />
            {layout.rootPaths.map((r, i) => (
              <path key={i} d={r.d} fill="#d8bff0" />
            ))}
            <rect x={layout.groundLeft} y={494} width={layout.groundWidth} height={18} rx={9} fill="#7fd0a0" />
            <text x={layout.centre} y={534} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff" opacity={0.9}>
              {group.name}
            </text>

            {layout.barkPaths.map((d, i) => (
              <path key={i} d={d} fill="url(#kt-bark)" />
            ))}

            {layout.clusters.map((c) => {
              const selected = selection.kind === "topic" && selection.id === c.id;
              const label = c.tier === "NOT_STARTED" ? c.name : `${c.name} ${c.accuracy}%`;
              return (
                <g
                  key={c.id}
                  className={`tree-leaf ${selected ? "sel" : ""} ${c.droops ? "droop" : ""}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${c.name}, ${TIER_LABEL[c.tier]}`}
                  onClick={activate({ kind: "topic", id: c.id })}
                  onKeyDown={activate({ kind: "topic", id: c.id })}
                >
                  <circle cx={c.x} cy={c.y} r={c.radius + 8} fill="transparent" />
                  <g className="cl">
                    {c.shapes.map((s, i) => (
                      <path
                        key={i}
                        transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${s.rot}) scale(${s.scale.toFixed(2)})`}
                        d={LEAF_PATH}
                        fill={SHADES[c.tone][s.shade]}
                        stroke="rgba(47,36,87,.18)"
                        strokeWidth={0.7}
                      />
                    ))}
                  </g>
                  {selected && <circle cx={c.x} cy={c.y} r={c.radius + 8} fill="none" stroke="#fff" strokeWidth={2.5} strokeDasharray="5 5" />}
                  <g className="tree-lbl" transform={`translate(${c.x} ${c.y - c.radius - 16})`}>
                    <rect x={-c.labelWidth / 2} y={-13} width={c.labelWidth} height={24} rx={12} style={{ fill: "rgb(var(--panel))" }} />
                    <text y={4} textAnchor="middle" fontSize={12} fontWeight={800} style={{ fill: "rgb(var(--ink))" }}>
                      {label}
                    </text>
                  </g>
                </g>
              );
            })}

            {layout.tags.map((t) => {
              const selected = selection.kind === "subject" && selection.id === t.id;
              return (
                <g
                  key={t.id}
                  className="tree-tag"
                  tabIndex={0}
                  role="button"
                  aria-label={`${t.name}, ${TIER_LABEL[t.tier]}`}
                  onClick={activate({ kind: "subject", id: t.id })}
                  onKeyDown={activate({ kind: "subject", id: t.id })}
                >
                  <rect
                    x={t.x - t.width / 2}
                    y={t.y - 15}
                    width={t.width}
                    height={30}
                    rx={15}
                    strokeWidth={selected ? 2.5 : 1.5}
                    style={{ fill: "rgb(var(--panel))", stroke: selected ? "#8b6cf0" : "rgb(var(--line))" }}
                  />
                  <circle cx={t.x - t.width / 2 + 16} cy={t.y} r={6} fill={SHADES[t.tone][1]} />
                  <text x={t.x + 8} y={t.y + 5} textAnchor="middle" fontSize={14} fontWeight={800} style={{ fill: "rgb(var(--ink))" }}>
                    {t.label}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-3 pb-2 pt-1 text-[13px] font-semibold text-slate-500">
            {(["strong", "gold", "rose", "idle"] as const).map((tone) => (
              <span key={tone} className="flex items-center gap-1.5">
                <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SHADES[tone][1] }} />
                {tone === "strong" ? "Strong" : tone === "gold" ? "Getting there" : tone === "rose" ? "Needs work" : "Not started or just started"}
              </span>
            ))}
          </div>
          <p className="px-3 pb-2 text-[13px] text-slate-500">
            Fuller foliage means higher accuracy. Drooping leaves need attention. Select a branch or a leaf for details.
          </p>
        </div>

        <aside className="card grid content-start gap-3 p-5" aria-live="polite">
          {selection.kind === "topic" && topicById.get(selection.id) ? (
            <TopicPanel topic={topicById.get(selection.id)!} />
          ) : selection.kind === "subject" && subjectById.get(selection.id) ? (
            <SubjectPanel
              subject={subjectById.get(selection.id)!}
              onPick={(id) => setSelection({ kind: "topic", id })}
            />
          ) : (
            <StreamPanel
              name={group.name}
              subjects={group.subjects}
              tier={streamTier}
              answers={streamAnswers}
              correct={streamCorrect}
              onPick={(id) => setSelection({ kind: "subject", id })}
            />
          )}
        </aside>
      </div>
    </section>
  );
}

