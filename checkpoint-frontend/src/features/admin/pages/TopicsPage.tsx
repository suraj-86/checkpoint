import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui/styles";
import * as api from "../api/catalogApi";
import type { CatalogSubject, CatalogTopic } from "../types/catalog.types";
import { useCatalogActions } from "../hooks/useCatalogActions";
import { Badge, SearchBox, SelectFilter, STATE_OPTIONS, matches } from "../components/catalogUi";

const QUESTION_OPTIONS = [
  { id: "with", name: "Has questions" },
  { id: "empty", name: "Empty topics" },
];

interface Row {
  topic: CatalogTopic;
  subject: CatalogSubject;
}

export function TopicsPage() {
  const { catalog, isLoading, isError, busy, error, run, ask, dialog } = useCatalogActions();
  const [params, setParams] = useSearchParams();
  const [state, setState] = useState("");
  const [content, setContent] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState("");

  const query = params.get("q") ?? "";
  const streamFilter = params.get("stream") ?? "";
  const examFilter = params.get("exam") ?? "";
  const subjectFilter = params.get("subject") ?? "";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const rows: Row[] = useMemo(() => {
    if (!catalog) return [];
    const out: Row[] = [];
    for (const subject of catalog.subjects) {
      if (subjectFilter && subject.id !== subjectFilter) continue;
      if (streamFilter && !subject.streamIds.includes(streamFilter)) continue;
      if (examFilter && !subject.examIds.includes(examFilter)) continue;
      for (const topic of subject.topics) {
        if (!matches(topic.name, query) && !matches(subject.name, query)) continue;
        if (state === "active" && !topic.active) continue;
        if (state === "retired" && topic.active) continue;
        if (content === "with" && topic.questionCount === 0) continue;
        if (content === "empty" && topic.questionCount > 0) continue;
        out.push({ topic, subject });
      }
    }
    return out.sort((a, b) => a.subject.name.localeCompare(b.subject.name) || a.topic.sortOrder - b.topic.sortOrder || a.topic.name.localeCompare(b.topic.name));
  }, [catalog, query, state, content, streamFilter, examFilter, subjectFilter]);

  const totalTopics = catalog ? catalog.subjects.reduce((n, s) => n + s.topics.length, 0) : 0;

  function startAdd() {
    setNewSubject(subjectFilter);
    setNewName("");
    setAdding(true);
  }

  function startEdit(r: Row) {
    setEditingId(r.topic.id);
    setEditName(r.topic.name);
    setEditSubject(r.subject.id);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Topics</h1>
        <p className="text-sm text-slate-500">
          Topics are the final level. Each topic belongs to one subject, and questions live in topics. Pick a topic to upload a dataset straight into it.
        </p>
      </div>

      {catalog && (
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox value={query} onChange={(v) => setParam("q", v)} placeholder="Search topics or subjects" />
          <SelectFilter
            label="Filter by stream"
            value={streamFilter}
            onChange={(v) => setParam("stream", v)}
            options={catalog.streams.map((s) => ({ id: s.id, name: s.name }))}
            allLabel="Any stream"
          />
          <SelectFilter
            label="Filter by exam"
            value={examFilter}
            onChange={(v) => setParam("exam", v)}
            options={catalog.exams.map((e) => ({ id: e.id, name: e.name }))}
            allLabel="Any exam"
          />
          <SelectFilter
            label="Filter by subject"
            value={subjectFilter}
            onChange={(v) => setParam("subject", v)}
            options={catalog.subjects.map((s) => ({ id: s.id, name: s.name }))}
            allLabel="Any subject"
          />
          <SelectFilter label="Filter by state" value={state} onChange={setState} options={STATE_OPTIONS} allLabel="Active and retired" />
          <SelectFilter label="Filter by content" value={content} onChange={setContent} options={QUESTION_OPTIONS} allLabel="With or without questions" />
          {!adding && (
            <button type="button" onClick={startAdd} className={primaryButton}>
              <span className="inline-flex items-center gap-1.5">
                <Plus size={16} /> Add topic
              </span>
            </button>
          )}
        </div>
      )}

      {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}
      {isLoading && <p className="text-slate-500">Loading...</p>}
      {isError && <p className="text-red-600">Could not load the catalog.</p>}

      {catalog && adding && (
        <form
          className="card flex flex-wrap items-end gap-3 p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run(() => api.createTopicInSubject({ name: newName, subjectId: newSubject }))) {
              setNewName("");
              setAdding(false);
            }
          }}
        >
          <div>
            <label htmlFor="new-topic-subject" className="mb-1 block text-sm font-medium text-slate-700">
              Subject
            </label>
            <select id="new-topic-subject" className={inputClass} value={newSubject} onChange={(e) => setNewSubject(e.target.value)}>
              <option value="">Choose a subject</option>
              {catalog.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[14rem] flex-1">
            <label htmlFor="new-topic-name" className="mb-1 block text-sm font-medium text-slate-700">
              Topic name
            </label>
            <input id="new-topic-name" className={inputClass} value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={100} placeholder="Sets and relations" />
          </div>
          <button type="submit" disabled={busy || !newSubject || newName.trim().length < 2} className={primaryButton}>
            Add topic
          </button>
          <button type="button" onClick={() => setAdding(false)} className={secondaryButton}>
            Cancel
          </button>
        </form>
      )}

      {catalog && (
        <p className="text-xs text-slate-400">
          Showing {rows.length} of {totalTopics} topic{totalTopics === 1 ? "" : "s"}
        </p>
      )}
      {catalog && totalTopics === 0 && !adding && <p className="text-sm text-slate-500">No topics yet. Add one above.</p>}
      {catalog && totalTopics > 0 && rows.length === 0 && <p className="text-sm text-slate-500">No topics match these filters.</p>}

      <ul className="space-y-2">
        {catalog &&
          rows.map(({ topic, subject }) => {
            const streams = catalog.streams.filter((s) => subject.streamIds.includes(s.id));
            const exams = catalog.exams.filter((e) => subject.examIds.includes(e.id));
            return (
              <li key={topic.id} className="card p-3">
                {editingId === topic.id ? (
                  <form
                    className="flex flex-wrap items-end gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const ok = await run(() =>
                        api.updateTopic(topic.id, {
                          name: editName,
                          active: topic.active,
                          subjectId: editSubject !== subject.id ? editSubject : undefined,
                        })
                      );
                      if (ok) setEditingId(null);
                    }}
                  >
                    <div className="min-w-[12rem] flex-1">
                      <label htmlFor={`edit-name-${topic.id}`} className="mb-1 block text-xs font-medium text-slate-600">
                        Topic name
                      </label>
                      <input id={`edit-name-${topic.id}`} className={inputClass} value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={100} />
                    </div>
                    <div>
                      <label htmlFor={`edit-subject-${topic.id}`} className="mb-1 block text-xs font-medium text-slate-600">
                        Move to subject
                      </label>
                      <select id={`edit-subject-${topic.id}`} className={inputClass} value={editSubject} onChange={(e) => setEditSubject(e.target.value)}>
                        {catalog.subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" disabled={busy || editName.trim().length < 2} className={primaryButton}>
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className={secondaryButton}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-semibold ${topic.active ? "text-slate-800" : "text-slate-400 line-through"}`}>{topic.name}</span>
                      <Badge tone="indigo">{subject.name}</Badge>
                      <Badge tone="slate">
                        {topic.activeQuestionCount} active / {topic.questionCount} questions
                      </Badge>
                      {!topic.active && <Badge tone="amber">Retired</Badge>}
                      {topic.questionCount === 0 && <Badge tone="emerald">Empty</Badge>}
                      <span className="ml-auto flex flex-wrap items-center gap-1">
                        <Link
                          to={`/admin/datasets/upload?topic=${topic.id}`}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                        >
                          <Upload size={13} /> Upload here
                        </Link>
                        <Link to={`/admin/questions?topic=${topic.id}`} className="rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50">
                          Questions
                        </Link>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => run(() => api.updateTopic(topic.id, { name: topic.name, active: !topic.active }))}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          {topic.active ? "Retire" : "Restore"}
                        </button>
                        <button type="button" aria-label={`Edit ${topic.name}`} onClick={() => startEdit({ topic, subject })} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${topic.name}`}
                          disabled={busy}
                          onClick={() =>
                            ask({
                              title: `Delete topic "${topic.name}"?`,
                              message: "Topics that still have questions cannot be deleted. Retire them instead.",
                              confirmLabel: "Delete topic",
                              action: () => api.deleteTopic(topic.id),
                            })
                          }
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    </div>
                    {(streams.length > 0 || exams.length > 0) && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                        <span>Reached through</span>
                        {streams.map((s) => (
                          <Badge key={s.id} tone="indigo">
                            {s.name}
                          </Badge>
                        ))}
                        {exams.map((e) => (
                          <Badge key={e.id} tone="violet">
                            {e.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
      </ul>

      {dialog}
    </div>
  );
}
