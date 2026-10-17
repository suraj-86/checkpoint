import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui/styles";
import type { Catalog, CatalogStream, NamedItemPayload } from "../types/catalog.types";
import { useCatalogActions } from "../hooks/useCatalogActions";
import { Badge, ChipPicker, SearchBox, SelectFilter, STATE_OPTIONS, matches } from "./catalogUi";

type Kind = "stream" | "exam";

interface GroupPageProps {
  kind: Kind;
  title: string;
  intro: string;
  singular: string;
  placeholder: string;
  pick: (c: Catalog) => CatalogStream[];
  create: (p: NamedItemPayload) => Promise<Catalog>;
  update: (id: string, p: NamedItemPayload) => Promise<Catalog>;
  remove: (id: string) => Promise<Catalog>;
  setSubjects: (id: string, ids: string[]) => Promise<Catalog>;
}

function GroupForm({
  initial,
  catalog,
  busy,
  onSubmit,
  onCancel,
  singular,
  placeholder,
}: {
  initial?: CatalogStream;
  catalog: Catalog;
  busy: boolean;
  onSubmit: (v: { name: string; description: string; active: boolean; subjectIds: string[] }) => void;
  onCancel: () => void;
  singular: string;
  placeholder: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [subjectIds, setSubjectIds] = useState<string[]>(initial?.subjectIds ?? []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, description, active, subjectIds });
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="group-name" className="mb-1 block text-sm font-medium text-slate-700">
            {singular} name
          </label>
          <input id="group-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder={placeholder} />
        </div>
        <div>
          <label htmlFor="group-desc" className="mb-1 block text-sm font-medium text-slate-700">
            Description (optional)
          </label>
          <input id="group-desc" className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
        </div>
      </div>
      <ChipPicker
        label={`Subjects in this ${singular.toLowerCase()}`}
        items={catalog.subjects.map((s) => ({ id: s.id, name: s.active ? s.name : `${s.name} (retired)` }))}
        selected={subjectIds}
        onChange={setSubjectIds}
        emptyText="No subjects yet. Add some on the Subjects page."
      />
      {initial && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="accent-indigo-600" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active (students can see it)
        </label>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={busy || name.trim().length < 2} className={primaryButton}>
          {initial ? `Save ${singular.toLowerCase()}` : `Add ${singular.toLowerCase()}`}
        </button>
        <button type="button" onClick={onCancel} className={secondaryButton}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** One page component serves both Streams and Exams, which behave identically. */
export function GroupPage({ kind, title, intro, singular, placeholder, pick, create, update, remove, setSubjects }: GroupPageProps) {
  const { catalog, isLoading, isError, busy, error, run, ask, dialog } = useCatalogActions();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const subjectFilter = params.get("subject") ?? "";

  const rows = useMemo(() => {
    if (!catalog) return [];
    return pick(catalog)
      .filter((g) => matches(g.name, query))
      .filter((g) => (subjectFilter ? g.subjectIds.includes(subjectFilter) : true))
      .filter((g) => (state === "active" ? g.active : state === "retired" ? !g.active : true));
  }, [catalog, pick, query, state, subjectFilter]);

  function setSubjectFilter(id: string) {
    const next = new URLSearchParams(params);
    if (id) next.set("subject", id);
    else next.delete("subject");
    setParams(next, { replace: true });
  }

  const lower = singular.toLowerCase();
  const all = catalog ? pick(catalog) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
        <p className="text-sm text-slate-500">{intro}</p>
      </div>

      {catalog && (
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox value={query} onChange={setQuery} placeholder={`Search ${title.toLowerCase()}`} />
          <SelectFilter
            label="Filter by subject"
            value={subjectFilter}
            onChange={setSubjectFilter}
            options={catalog.subjects.map((s) => ({ id: s.id, name: s.name }))}
            allLabel="Any subject"
          />
          <SelectFilter label="Filter by state" value={state} onChange={setState} options={STATE_OPTIONS} allLabel="Active and retired" />
          {!adding && (
            <button type="button" onClick={() => setAdding(true)} className={primaryButton}>
              <span className="inline-flex items-center gap-1.5">
                <Plus size={16} /> Add {lower}
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
          <h2 className="mb-3 text-base font-semibold text-slate-800">New {lower}</h2>
          <GroupForm
            singular={singular}
            placeholder={placeholder}
            catalog={catalog}
            busy={busy}
            onCancel={() => setAdding(false)}
            onSubmit={async (v) => {
              const ok = await run(async () => {
                const afterCreate = await create({ name: v.name, description: v.description });
                const created = pick(afterCreate).find((g) => g.name.toLowerCase() === v.name.trim().toLowerCase());
                return created && v.subjectIds.length > 0 ? setSubjects(created.id, v.subjectIds) : afterCreate;
              });
              if (ok) setAdding(false);
            }}
          />
        </div>
      )}

      {catalog && all.length === 0 && !adding && <p className="text-sm text-slate-500">No {title.toLowerCase()} yet.</p>}
      {catalog && all.length > 0 && rows.length === 0 && <p className="text-sm text-slate-500">No {title.toLowerCase()} match these filters.</p>}

      {catalog &&
        rows.map((g) => {
          const subjects = catalog.subjects.filter((s) => g.subjectIds.includes(s.id));
          const topicCount = subjects.reduce((n, s) => n + s.topics.length, 0);
          const questionCount = subjects.reduce((n, s) => n + s.topics.reduce((m, t) => m + t.activeQuestionCount, 0), 0);
          const param = `${kind}=${g.id}`;
          return (
            <div key={g.id} className="card space-y-3 p-4">
              {editingId === g.id ? (
                <GroupForm
                  initial={g}
                  singular={singular}
                  placeholder={placeholder}
                  catalog={catalog}
                  busy={busy}
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (v) => {
                    const ok = await run(async () => {
                      await update(g.id, { name: v.name, description: v.description, active: v.active });
                      return setSubjects(g.id, v.subjectIds);
                    });
                    if (ok) setEditingId(null);
                  }}
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className={`text-lg font-semibold ${g.active ? "text-slate-800" : "text-slate-400 line-through"}`}>{g.name}</h2>
                      {g.description && <p className="text-sm text-slate-500">{g.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => run(() => update(g.id, { name: g.name, description: g.description, active: !g.active }))}
                        className={secondaryButton}
                      >
                        {g.active ? "Retire" : "Restore"}
                      </button>
                      <button type="button" onClick={() => setEditingId(g.id)} className={`${secondaryButton} inline-flex items-center gap-1.5`}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`Delete ${g.name}`}
                        onClick={() =>
                          ask({
                            title: `Delete ${lower} "${g.name}"?`,
                            message: "Its subjects, topics and questions are not deleted. Only the links to them are removed.",
                            confirmLabel: `Delete ${lower}`,
                            action: () => remove(g.id),
                          })
                        }
                        className="rounded-xl border border-rose-200 px-3 py-2 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {!g.active && <Badge tone="amber">Retired</Badge>}
                    {subjects.length === 0 && <span className="text-xs text-slate-400">No subjects linked yet. Use Edit to add some.</span>}
                    {subjects.map((s) => (
                      <Link key={s.id} to={`/admin/subjects?${kind}=${g.id}`} title={`See ${s.name} and its siblings`}>
                        <Badge tone={s.active ? "indigo" : "amber"}>{s.name}</Badge>
                      </Link>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span>
                      {subjects.length} subject{subjects.length === 1 ? "" : "s"}, {topicCount} topic{topicCount === 1 ? "" : "s"}, {questionCount} active question
                      {questionCount === 1 ? "" : "s"}
                    </span>
                    <span className="ml-auto flex gap-2">
                      <Link to={`/admin/subjects?${param}`} className="font-medium text-indigo-600 hover:underline">
                        Subjects
                      </Link>
                      <Link to={`/admin/topics?${param}`} className="font-medium text-indigo-600 hover:underline">
                        Topics
                      </Link>
                      <Link to={`/admin/questions?${param}`} className="font-medium text-indigo-600 hover:underline">
                        Questions
                      </Link>
                      <Link to={`/admin/datasets/upload?${param}`} className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline">
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
