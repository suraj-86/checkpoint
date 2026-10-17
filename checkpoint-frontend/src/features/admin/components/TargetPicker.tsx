import { useMemo, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { inputClass, secondaryButton } from "@/components/ui/styles";
import type { Catalog } from "../types/catalog.types";
import { SearchBox, matches } from "./catalogUi";

export type TargetMode = "topic" | "file";

export interface Target {
  streamId: string;
  subjectId: string;
  topicId: string;
  mode: TargetMode;
}

export const EMPTY_TARGET: Target = { streamId: "", subjectId: "", topicId: "", mode: "topic" };

export function targetReady(t: Target): boolean {
  return t.mode === "topic" ? t.topicId !== "" : t.subjectId !== "";
}

interface TargetPickerProps {
  catalog: Catalog;
  target: Target;
  onChange: (t: Target) => void;
  onCreateTopic: (subjectId: string, name: string) => Promise<string | null>;
  disabled?: boolean;
}

function ListButton({ selected, onClick, children, muted }: { selected: boolean; onClick: () => void; children: ReactNode; muted?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
        selected ? "bg-indigo-600 text-white shadow" : muted ? "text-slate-400 hover:bg-slate-100" : "text-slate-700 hover:bg-indigo-50"
      }`}
    >
      {children}
    </button>
  );
}

export function TargetPicker({ catalog, target, onChange, onCreateTopic, disabled }: TargetPickerProps) {
  const [subjectQuery, setSubjectQuery] = useState("");
  const [topicQuery, setTopicQuery] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [creating, setCreating] = useState(false);

  const subjects = useMemo(
    () =>
      catalog.subjects
        .filter((s) => s.active)
        .filter((s) => (target.streamId ? s.streamIds.includes(target.streamId) : true))
        .filter((s) => matches(s.name, subjectQuery)),
    [catalog, target.streamId, subjectQuery]
  );

  const subject = catalog.subjects.find((s) => s.id === target.subjectId) ?? null;
  const topics = subject ? subject.topics.filter((t) => t.active && matches(t.name, topicQuery)) : [];
  const chosenTopic = subject?.topics.find((t) => t.id === target.topicId) ?? null;

  async function addTopic() {
    if (!subject || newTopic.trim().length < 2) return;
    setCreating(true);
    const id = await onCreateTopic(subject.id, newTopic.trim());
    setCreating(false);
    if (id) {
      setNewTopic("");
      onChange({ ...target, topicId: id, mode: "topic" });
    }
  }

  return (
    <div className="card space-y-4 p-5">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Where should this dataset go?</h2>
        <p className="text-sm text-slate-500">Choose a subject, then a topic. Every question in the file is saved in that topic.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-slate-700">1. Subject</h3>
            <select
              aria-label="Narrow subjects by stream"
              disabled={disabled}
              className={`${inputClass} w-auto max-w-[11rem] py-1`}
              value={target.streamId}
              onChange={(e) => onChange({ ...target, streamId: e.target.value })}
            >
              <option value="">All streams</option>
              {catalog.streams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <SearchBox value={subjectQuery} onChange={setSubjectQuery} placeholder="Search subjects" />
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-100 bg-white/60 p-1.5">
            {subjects.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">No subjects found. Add one on the Subjects page.</p>}
            {subjects.map((s) => (
              <ListButton key={s.id} selected={s.id === target.subjectId} onClick={() => onChange({ ...target, subjectId: s.id, topicId: "" })}>
                <span>{s.name}</span>
                <span className="text-xs opacity-70">{s.topics.length} topics</span>
              </ListButton>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-700">2. Topic {subject && <span className="font-normal text-slate-400">in {subject.name}</span>}</h3>
          {!subject ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">Pick a subject first.</p>
          ) : (
            <>
              <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-sm" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={target.mode === "topic"}
                  onClick={() => onChange({ ...target, mode: "topic" })}
                  className={`flex-1 rounded-lg px-3 py-1.5 font-medium ${target.mode === "topic" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}
                >
                  One topic
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={target.mode === "file"}
                  onClick={() => onChange({ ...target, mode: "file", topicId: "" })}
                  className={`flex-1 rounded-lg px-3 py-1.5 font-medium ${target.mode === "file" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}
                >
                  Topics from the file
                </button>
              </div>

              {target.mode === "file" ? (
                <p className="rounded-xl bg-indigo-50 px-3 py-3 text-sm text-indigo-800">
                  Each question's own <code>topic</code> field decides its topic inside <strong>{subject.name}</strong>. Missing topics are created there.
                </p>
              ) : (
                <>
                  <SearchBox value={topicQuery} onChange={setTopicQuery} placeholder="Search topics" />
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-100 bg-white/60 p-1.5">
                    {topics.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">No topics here yet. Create one below.</p>}
                    {topics.map((t) => (
                      <ListButton key={t.id} selected={t.id === target.topicId} onClick={() => onChange({ ...target, topicId: t.id })}>
                        <span>{t.name}</span>
                        <span className="text-xs opacity-70">{t.activeQuestionCount} questions</span>
                      </ListButton>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      aria-label="New topic name"
                      className={inputClass}
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      maxLength={100}
                      placeholder={`New topic in ${subject.name}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void addTopic();
                        }
                      }}
                    />
                    <button type="button" disabled={disabled || creating || newTopic.trim().length < 2} onClick={addTopic} className={secondaryButton}>
                      <span className="inline-flex items-center gap-1">
                        <Plus size={14} /> Add
                      </span>
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {targetReady(target) && subject && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Target: <strong>{subject.name}</strong> &rsaquo; <strong>{target.mode === "topic" ? chosenTopic?.name : "topics from the file"}</strong>
        </p>
      )}
    </div>
  );
}
