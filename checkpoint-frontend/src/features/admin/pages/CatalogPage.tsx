import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui/styles";
import * as api from "../api/catalogApi";
import type { Catalog, CatalogStream, CatalogSubject, CatalogTopic } from "../types/catalog.types";
import { messageFromError } from "../utils/format";

const CATALOG_KEY = ["admin-catalog"];

type Run = (action: () => Promise<Catalog>) => Promise<boolean>;
type Tab = "subjects" | "streams" | "exams";

interface Pending {
  title: string;
  message: string;
  confirmLabel: string;
  action: () => Promise<Catalog>;
}

function Badge({ children, tone }: { children: ReactNode; tone: "indigo" | "violet" | "slate" | "amber" }) {
  const styles = {
    indigo: "bg-indigo-50 text-indigo-700",
    violet: "bg-violet-50 text-violet-700",
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-50 text-amber-700",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[tone]}`}>{children}</span>;
}

function CheckList({
  label,
  items,
  selected,
  onChange,
  emptyText,
}: {
  label: string;
  items: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  emptyText: string;
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-slate-700">{label}</legend>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <label
              key={item.id}
              className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
                selected.includes(item.id)
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white/70 text-slate-600 hover:bg-white"
              }`}
            >
              <input type="checkbox" className="accent-indigo-600" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} />
              {item.name}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

function SubjectForm({
  initial,
  catalog,
  busy,
  onSubmit,
  onCancel,
}: {
  initial?: CatalogSubject;
  catalog: Catalog;
  busy: boolean;
  onSubmit: (values: { name: string; description: string; active: boolean; streamIds: string[]; examIds: string[] }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [streamIds, setStreamIds] = useState<string[]>(initial?.streamIds ?? []);
  const [examIds, setExamIds] = useState<string[]>(initial?.examIds ?? []);

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
      <CheckList
        label="Streams that include this subject"
        items={catalog.streams}
        selected={streamIds}
        onChange={setStreamIds}
        emptyText="No streams yet. Add one in the Streams tab."
      />
      <CheckList
        label="Exams that include this subject"
        items={catalog.exams}
        selected={examIds}
        onChange={setExamIds}
        emptyText="No exams yet. Add one in the Exams tab."
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

function TopicRow({ topic, busy, run, ask }: { topic: CatalogTopic; busy: boolean; run: Run; ask: (p: Pending) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(topic.name);

  async function save() {
    if (await run(() => api.updateTopic(topic.id, { name, active: topic.active }))) setEditing(false);
  }

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-white/60 px-3 py-2">
      {editing ? (
        <>
          <input aria-label="Topic name" className={`${inputClass} max-w-xs`} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          <button type="button" disabled={busy || name.trim().length < 2} onClick={save} className={primaryButton}>
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setName(topic.name);
              setEditing(false);
            }}
            className={secondaryButton}
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <span className={`text-sm font-medium ${topic.active ? "text-slate-800" : "text-slate-400 line-through"}`}>{topic.name}</span>
          <Badge tone="slate">{topic.activeQuestionCount} active / {topic.questionCount} questions</Badge>
          {!topic.active && <Badge tone="amber">Retired</Badge>}
          <span className="ml-auto flex gap-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => api.updateTopic(topic.id, { name: topic.name, active: !topic.active }))}
              className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              {topic.active ? "Retire" : "Restore"}
            </button>
            <button type="button" aria-label={`Rename ${topic.name}`} onClick={() => setEditing(true)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
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
        </>
      )}
    </li>
  );
}

function AddTopic({ subjectId, busy, run }: { subjectId: string; busy: boolean; run: Run }) {
  const [name, setName] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (await run(() => api.createTopic(subjectId, { name }))) setName("");
      }}
      className="flex flex-wrap gap-2"
    >
      <input aria-label="New topic name" className={`${inputClass} max-w-xs`} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Add a topic, for example Sets" />
      <button type="submit" disabled={busy || name.trim().length < 2} className={secondaryButton}>
        <span className="inline-flex items-center gap-1">
          <Plus size={14} /> Add topic
        </span>
      </button>
    </form>
  );
}

function SubjectsTab({ catalog, busy, run, ask }: { catalog: Catalog; busy: boolean; run: Run; ask: (p: Pending) => void }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const streamName = (id: string) => catalog.streams.find((s) => s.id === id)?.name ?? "?";
  const examName = (id: string) => catalog.exams.find((e) => e.id === id)?.name ?? "?";

  return (
    <div className="space-y-4">
      {adding ? (
        <div className="card p-4">
          <h2 className="mb-3 text-base font-semibold text-slate-800">New subject</h2>
          <SubjectForm
            catalog={catalog}
            busy={busy}
            onCancel={() => setAdding(false)}
            onSubmit={async (v) => {
              if (await run(() => api.createSubject({ name: v.name, description: v.description, streamIds: v.streamIds, examIds: v.examIds }))) {
                setAdding(false);
              }
            }}
          />
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className={primaryButton}>
          <span className="inline-flex items-center gap-1.5">
            <Plus size={16} /> Add subject
          </span>
        </button>
      )}

      {catalog.subjects.length === 0 && <p className="text-sm text-slate-500">No subjects yet.</p>}

      {catalog.subjects.map((subject) => (
        <div key={subject.id} className="card space-y-3 p-4">
          {editingId === subject.id ? (
            <SubjectForm
              initial={subject}
              catalog={catalog}
              busy={busy}
              onCancel={() => setEditingId(null)}
              onSubmit={async (v) => {
                if (
                  await run(() =>
                    api.updateSubject(subject.id, {
                      name: v.name,
                      description: v.description,
                      active: v.active,
                      streamIds: v.streamIds,
                      examIds: v.examIds,
                    })
                  )
                ) {
                  setEditingId(null);
                }
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
                    aria-label={`Delete ${subject.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {!subject.active && <Badge tone="amber">Retired</Badge>}
                {subject.streamIds.map((id) => (
                  <Badge key={id} tone="indigo">
                    {streamName(id)}
                  </Badge>
                ))}
                {subject.examIds.map((id) => (
                  <Badge key={id} tone="violet">
                    {examName(id)}
                  </Badge>
                ))}
                {subject.streamIds.length === 0 && subject.examIds.length === 0 && <Badge tone="slate">Not linked to any stream or exam</Badge>}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium text-slate-600">Topics</h3>
                {subject.topics.length === 0 ? (
                  <p className="mb-2 text-sm text-slate-400">No topics yet.</p>
                ) : (
                  <ul className="mb-3 space-y-1.5">
                    {subject.topics.map((t) => (
                      <TopicRow key={t.id} topic={t} busy={busy} run={run} ask={ask} />
                    ))}
                  </ul>
                )}
                <AddTopic subjectId={subject.id} busy={busy} run={run} />
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function NamedItemsTab({
  kind,
  items,
  busy,
  run,
  ask,
  create,
  update,
  remove,
}: {
  kind: "Stream" | "Exam";
  items: CatalogStream[];
  busy: boolean;
  run: Run;
  ask: (p: Pending) => void;
  create: typeof api.createStream;
  update: typeof api.updateStream;
  remove: typeof api.deleteStream;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  function startEdit(item: CatalogStream) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDescription(item.description ?? "");
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run(() => create({ name, description }))) {
            setName("");
            setDescription("");
          }
        }}
        className="card flex flex-wrap items-end gap-3 p-4"
      >
        <div className="min-w-[200px] flex-1">
          <label htmlFor={`new-${kind}-name`} className="mb-1 block text-sm font-medium text-slate-700">
            New {kind.toLowerCase()} name
          </label>
          <input id={`new-${kind}-name`} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder={kind === "Stream" ? "Science (PCM)" : "JEE Main"} />
        </div>
        <div className="min-w-[200px] flex-1">
          <label htmlFor={`new-${kind}-desc`} className="mb-1 block text-sm font-medium text-slate-700">
            Description (optional)
          </label>
          <input id={`new-${kind}-desc`} className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
        </div>
        <button type="submit" disabled={busy || name.trim().length < 2} className={primaryButton}>
          Add {kind.toLowerCase()}
        </button>
      </form>

      {items.length === 0 && <p className="text-sm text-slate-500">No {kind.toLowerCase()}s yet.</p>}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="card p-4">
            {editingId === item.id ? (
              <div className="flex flex-wrap items-end gap-3">
                <input aria-label={`${kind} name`} className={`${inputClass} min-w-[200px] flex-1`} value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={100} />
                <input aria-label={`${kind} description`} className={`${inputClass} min-w-[200px] flex-1`} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} maxLength={300} />
                <button
                  type="button"
                  disabled={busy || editName.trim().length < 2}
                  onClick={async () => {
                    if (await run(() => update(item.id, { name: editName, description: editDescription, active: item.active }))) setEditingId(null);
                  }}
                  className={primaryButton}
                >
                  Save
                </button>
                <button type="button" onClick={() => setEditingId(null)} className={secondaryButton}>
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${item.active ? "text-slate-800" : "text-slate-400 line-through"}`}>{item.name}</p>
                  {item.description && <p className="text-sm text-slate-500">{item.description}</p>}
                </div>
                <Badge tone="slate">{item.subjectCount} subject{item.subjectCount === 1 ? "" : "s"}</Badge>
                {!item.active && <Badge tone="amber">Retired</Badge>}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => update(item.id, { name: item.name, description: item.description, active: !item.active }))}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  {item.active ? "Retire" : "Restore"}
                </button>
                <button type="button" aria-label={`Edit ${item.name}`} onClick={() => startEdit(item)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${item.name}`}
                  disabled={busy}
                  onClick={() =>
                    ask({
                      title: `Delete ${kind.toLowerCase()} "${item.name}"?`,
                      message: "Its subjects and questions are not deleted. Only the links to them are removed.",
                      confirmLabel: `Delete ${kind.toLowerCase()}`,
                      action: () => remove(item.id),
                    })
                  }
                  className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CatalogPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("subjects");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  const { data: catalog, isLoading, isError } = useQuery({ queryKey: CATALOG_KEY, queryFn: api.getCatalog });

  const run: Run = async (action) => {
    setBusy(true);
    setError(null);
    try {
      const next = await action();
      queryClient.setQueryData(CATALOG_KEY, next);
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      return true;
    } catch (err) {
      setError(messageFromError(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  async function confirmPending() {
    if (!pending) return;
    const action = pending.action;
    setPending(null);
    await run(action);
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "subjects", label: "Subjects", count: catalog?.subjects.length },
    { id: "streams", label: "Streams", count: catalog?.streams.length },
    { id: "exams", label: "Exams", count: catalog?.exams.length },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Catalog</h1>
        <p className="text-sm text-slate-500">
          Streams and exams group subjects. Each subject has topics, and questions live in topics. A subject can belong to several streams and exams.
        </p>
      </div>

      <div className="flex gap-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === t.id ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-white/70 text-slate-600 hover:bg-white"
            }`}
          >
            {t.label}
            {t.count !== undefined && <span className="ml-1.5 opacity-80">{t.count}</span>}
          </button>
        ))}
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}
      {isLoading && <p className="text-slate-500">Loading catalog...</p>}
      {isError && <p className="text-red-600">Could not load the catalog.</p>}

      {catalog && tab === "subjects" && <SubjectsTab catalog={catalog} busy={busy} run={run} ask={setPending} />}
      {catalog && tab === "streams" && (
        <NamedItemsTab
          kind="Stream"
          items={catalog.streams}
          busy={busy}
          run={run}
          ask={setPending}
          create={api.createStream}
          update={api.updateStream}
          remove={api.deleteStream}
        />
      )}
      {catalog && tab === "exams" && (
        <NamedItemsTab
          kind="Exam"
          items={catalog.exams}
          busy={busy}
          run={run}
          ask={setPending}
          create={api.createExam}
          update={api.updateExam}
          remove={api.deleteExam}
        />
      )}

      <ConfirmDialog
        open={pending !== null}
        title={pending?.title ?? ""}
        tone="warning"
        confirmLabel={pending?.confirmLabel ?? "Delete"}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      >
        <p>{pending?.message}</p>
      </ConfirmDialog>
    </div>
  );
}
