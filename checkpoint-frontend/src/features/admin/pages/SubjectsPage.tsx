import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui/styles";
import * as api from "../api/catalogApi";
import type { Catalog, CatalogSubject } from "../types/catalog.types";
import { useCatalogActions } from "../hooks/useCatalogActions";
import { Badge, ChipPicker, SearchBox, SelectFilter, STATE_OPTIONS, matches } from "../components/catalogUi";

function SubjectForm({
  initial,
  catalog,
  busy,
  presetStreamId,
  presetExamId,
  onSubmit,
  onCancel,
}: {
  initial?: CatalogSubject;
  catalog: Catalog;
  busy: boolean;
  presetStreamId?: string;
  presetExamId?: string;
  onSubmit: (v: { name: string; description: string; active: boolean; streamIds: string[]; examIds: string[] }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [streamIds, setStreamIds] = useState<string[]>(initial?.streamIds ?? (presetStreamId ? [presetStreamId] : []));
  const [examIds, setExamIds] = useState<string[]>(initial?.examIds ?? (presetExamId ? [presetExamId] : []));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, description, active, streamIds, examIds });
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="subject-name" className="mb-1 block text-sm font-medium text-slate-700">
            Subject name
          </label>
          <input id="subject-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Maths" />
        </div>
        <div>
          <label htmlFor="subject-desc" className="mb-1 block text-sm font-medium text-slate-700">
            Description (optional)
          </label>
          <input id="subject-desc" className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
        </div>
      </div>
      <ChipPicker
        label="Streams that include this subject"
        items={catalog.streams.map((s) => ({ id: s.id, name: s.name }))}
        selected={streamIds}
        onChange={setStreamIds}
        emptyText="No streams yet. Add one on the Streams page."
      />
      <ChipPicker
        label="Exams that test this subject"
        items={catalog.exams.map((e) => ({ id: e.id, name: e.name }))}
        selected={examIds}
        onChange={setExamIds}
        emptyText="No exams yet. Add one on the Exams page."
      />
      {initial && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="accent-indigo-600" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active (students can see it)
        </label>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={busy || name.trim().length < 2} className={primaryButton}>
          {initial ? "Save subject" : "Add subject"}
        </button>
        <button type="button" onClick={onCancel} className={secondaryButton}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function SubjectsPage() {
  const { catalog, isLoading, isError, busy, error, run, ask, dialog } = useCatalogActions();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const streamFilter = params.get("stream") ?? "";
  const examFilter = params.get("exam") ?? "";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const rows = useMemo(() => {
    if (!catalog) return [];
    return catalog.subjects
      .filter((s) => matches(s.name, query) || s.topics.some((t) => matches(t.name, query)))
      .filter((s) => (streamFilter ? s.streamIds.includes(streamFilter) : true))
      .filter((s) => (examFilter ? s.examIds.includes(examFilter) : true))
      .filter((s) => (state === "active" ? s.active : state === "retired" ? !s.active : true));
  }, [catalog, query, state, streamFilter, examFilter]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Subjects</h1>
        <p className="text-sm text-slate-500">
          A subject such as Maths or Physics holds topics. It can belong to several streams and exams, so Physics can sit in both JEE and NEET.
        </p>
      </div>

      {catalog && (
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox value={query} onChange={setQuery} placeholder="Search subjects or their topics" />
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
          <SelectFilter label="Filter by state" value={state} onChange={setState} options={STATE_OPTIONS} allLabel="Active and retired" />
          {!adding && (
            <button type="button" onClick={() => setAdding(true)} className={primaryButton}>
              <span className="inline-flex items-center gap-1.5">
                <Plus size={16} /> Add subject
              </span>
            </button>
          )}
        </div>
      )}

      {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}
      {isLoading && <p className="text-slate-500">Loading...</p>}
      {isError && <p className="text-red-600">Could not load the catalog.</p>}

      {catalog && adding && (
        <div className="card p-4">
          <h2 className="mb-3 text-base font-semibold text-slate-800">New subject</h2>
          <SubjectForm
            catalog={catalog}
            busy={busy}
            presetStreamId={streamFilter || undefined}
            presetExamId={examFilter || undefined}
            onCancel={() => setAdding(false)}
            onSubmit={async (v) => {
              if (await run(() => api.createSubject({ name: v.name, description: v.description, streamIds: v.streamIds, examIds: v.examIds }))) {
                setAdding(false);
              }
            }}
          />
        </div>
      )}

      {catalog && catalog.subjects.length === 0 && !adding && <p className="text-sm text-slate-500">No subjects yet.</p>}
      {catalog && catalog.subjects.length > 0 && rows.length === 0 && <p className="text-sm text-slate-500">No subjects match these filters.</p>}

      {catalog &&
        rows.map((subject) => {
          const streams = catalog.streams.filter((s) => subject.streamIds.includes(s.id));
          const exams = catalog.exams.filter((e) => subject.examIds.includes(e.id));
          const questions = subject.topics.reduce((n, t) => n + t.activeQuestionCount, 0);
          return (
            <div key={subject.id} className="card space-y-3 p-4">
              {editingId === subject.id ? (
                <SubjectForm
                  initial={subject}
                  catalog={catalog}
                  busy={busy}
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (v) => {
                    const ok = await run(() =>
                      api.updateSubject(subject.id, {
                        name: v.name,
                        description: v.description,
                        active: v.active,
                        streamIds: v.streamIds,
                        examIds: v.examIds,
                      })
                    );
                    if (ok) setEditingId(null);
                  }}
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className={`text-lg font-semibold ${subject.active ? "text-slate-800" : "text-slate-400 line-through"}`}>{subject.name}</h2>
                      {subject.description && <p className="text-sm text-slate-500">{subject.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setEditingId(subject.id)} className={`${secondaryButton} inline-flex items-center gap-1.5`}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`Delete ${subject.name}`}
                        onClick={() =>
                          ask({
                            title: `Delete subject "${subject.name}"?`,
                            message:
                              "Its empty topics are deleted with it. A subject that still has questions cannot be deleted. Retire it instead.",
                            confirmLabel: "Delete subject",
                            action: () => api.deleteSubject(subject.id),
                          })
                        }
                        className="rounded-xl border border-rose-200 px-3 py-2 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {!subject.active && <Badge tone="amber">Retired</Badge>}
                    {streams.map((s) => (
                      <Link key={s.id} to={`/admin/streams?subject=${subject.id}`}>
                        <Badge tone="indigo">{s.name}</Badge>
                      </Link>
                    ))}
                    {exams.map((e) => (
                      <Link key={e.id} to={`/admin/exams?subject=${subject.id}`}>
                        <Badge tone="violet">{e.name}</Badge>
                      </Link>
                    ))}
                    {streams.length === 0 && exams.length === 0 && <span className="text-xs text-slate-400">Not in any stream or exam yet.</span>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span>
                      {subject.topics.length} topic{subject.topics.length === 1 ? "" : "s"}, {questions} active question{questions === 1 ? "" : "s"}
                    </span>
                    {subject.topics.slice(0, 6).map((t) => (
                      <Link key={t.id} to={`/admin/topics?subject=${subject.id}&q=${encodeURIComponent(t.name)}`}>
                        <Badge tone={t.active ? "slate" : "amber"}>{t.name}</Badge>
                      </Link>
                    ))}
                    {subject.topics.length > 6 && <span className="text-xs">+{subject.topics.length - 6} more</span>}
                    <span className="ml-auto flex gap-3">
                      <Link to={`/admin/topics?subject=${subject.id}`} className="font-medium text-indigo-600 hover:underline">
                        Topics
                      </Link>
                      <Link to={`/admin/questions?subject=${subject.id}`} className="font-medium text-indigo-600 hover:underline">
                        Questions
                      </Link>
                      <Link to={`/admin/datasets/upload?subject=${subject.id}`} className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline">
                        <Upload size={13} /> Upload
                      </Link>
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}

      {dialog}
    </div>
  );
}
