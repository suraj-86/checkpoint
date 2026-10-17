import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { inputClass } from "@/components/ui/styles";
import { getDatasets } from "../api/adminApi";
import { getCatalog } from "../api/catalogApi";
import {
  deleteDataset,
  getDatasetImpact,
  moveDatasetToTopic,
  restoreDataset,
  retireDataset,
} from "../api/datasetActionsApi";
import { Badge, SearchBox, SelectFilter, matches } from "../components/catalogUi";
import { CATALOG_KEY } from "../hooks/useCatalogActions";
import type { DatasetSummary } from "../types/admin.types";
import { formatDateTime, messageFromError } from "../utils/format";

export function DatasetHistoryPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["admin-datasets"], queryFn: getDatasets });

  const { data: catalog } = useQuery({ queryKey: CATALOG_KEY, queryFn: getCatalog });
  const [query, setQuery] = useState("");
  const [streamFilter, setStreamFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [moving, setMoving] = useState<DatasetSummary | null>(null);
  const [moveSubject, setMoveSubject] = useState("");
  const [moveTopic, setMoveTopic] = useState("");

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<DatasetSummary | null>(null);
  const [typedName, setTypedName] = useState("");

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-datasets"] });
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
  }

  const toggleMutation = useMutation({
    mutationFn: (d: DatasetSummary) => (d.activeQuestionCount > 0 ? retireDataset(d.id) : restoreDataset(d.id)),
    onMutate: () => {
      setError(null);
      setNotice(null);
    },
    onSuccess: (result) => {
      setNotice(result.message);
      refresh();
    },
    onError: (err) => setError(messageFromError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (d: DatasetSummary) => deleteDataset(d.id, typedName),
    onMutate: () => {
      setError(null);
      setNotice(null);
    },
    onSuccess: (result) => {
      setNotice(result.message);
      closeDeleteDialog();
      refresh();
    },
    onError: (err) => setError(messageFromError(err)),
  });

  const moveMutation = useMutation({
    mutationFn: () => moveDatasetToTopic(moving!.id, moveTopic),
    onMutate: () => {
      setError(null);
      setNotice(null);
    },
    onSuccess: (result) => {
      setNotice(result.message);
      setMoving(null);
      refresh();
      queryClient.invalidateQueries({ queryKey: CATALOG_KEY });
    },
    onError: (err) => {
      setMoving(null);
      setError(messageFromError(err));
    },
  });

  const impactQuery = useQuery({
    queryKey: ["admin-dataset-impact", deleting?.id],
    queryFn: () => getDatasetImpact(deleting!.id),
    enabled: deleting !== null,
  });

  function handleToggle(d: DatasetSummary) {
    if (
      d.activeQuestionCount > 0 &&
      !window.confirm(
        `Retire all ${d.activeQuestionCount} active questions in "${d.name}"? Students will stop seeing them in new sessions. You can restore them later.`
      )
    ) {
      return;
    }
    toggleMutation.mutate(d);
  }

  function openDeleteDialog(d: DatasetSummary) {
    setError(null);
    setNotice(null);
    setTypedName("");
    setDeleting(d);
  }

  function closeDeleteDialog() {
    setDeleting(null);
    setTypedName("");
  }

  const visible = useMemo(() => {
    if (!data) return [];
    const streamSubjects = new Set(
      catalog && streamFilter ? catalog.subjects.filter((x) => x.streamIds.includes(streamFilter)).map((x) => x.id) : []
    );
    return data.filter((d) => {
      if (query && !matches(d.name, query) && !d.topics.some((t) => matches(t.topicName, query) || matches(t.subjectName ?? "", query))) return false;
      if (streamFilter && !d.topics.some((t) => t.subjectId && streamSubjects.has(t.subjectId))) return false;
      if (subjectFilter && !d.topics.some((t) => t.subjectId === subjectFilter)) return false;
      if (topicFilter && !d.topics.some((t) => t.topicId === topicFilter)) return false;
      return true;
    });
  }, [data, catalog, query, streamFilter, subjectFilter, topicFilter]);

  const filterSubjects = catalog ? catalog.subjects.filter((x) => !streamFilter || x.streamIds.includes(streamFilter)) : [];
  const filterTopics = filterSubjects
    .filter((x) => !subjectFilter || x.id === subjectFilter)
    .flatMap((x) => x.topics.map((t) => ({ id: t.id, name: subjectFilter ? t.name : `${x.name}: ${t.name}` })));
  const hasFilters = query !== "" || streamFilter !== "" || subjectFilter !== "" || topicFilter !== "";

  function openMove(d: DatasetSummary) {
    setError(null);
    setNotice(null);
    setMoveSubject(d.topics.length === 1 ? (d.topics[0].subjectId ?? "") : "");
    setMoveTopic("");
    setMoving(d);
  }

  const moveSubjectTopics = catalog?.subjects.find((x) => x.id === moveSubject)?.topics.filter((t) => t.active) ?? [];

  const impact = impactQuery.data;
  const nameMatches = deleting !== null && typedName.trim() === deleting.name;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Datasets</h1>
        <Link
          to="/admin/datasets/upload"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Upload dataset
        </Link>
      </div>

      {notice && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>}
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {isLoading && <p className="text-sm text-slate-400">Loading...</p>}
      {isError && <p className="text-sm text-red-600">Could not load datasets.</p>}

      {data && data.length === 0 && (
        <p className="card p-6 text-sm text-slate-500">
          No datasets yet. Upload your first one to fill the question bank.
        </p>
      )}

      {data && data.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox value={query} onChange={setQuery} placeholder="Search datasets, subjects or topics" />
          <SelectFilter
            label="Filter by stream"
            value={streamFilter}
            onChange={(v) => {
              setStreamFilter(v);
              setSubjectFilter("");
              setTopicFilter("");
            }}
            options={catalog?.streams.map((x) => ({ id: x.id, name: x.name })) ?? []}
            allLabel="Any stream"
          />
          <SelectFilter
            label="Filter by subject"
            value={subjectFilter}
            onChange={(v) => {
              setSubjectFilter(v);
              setTopicFilter("");
            }}
            options={filterSubjects.map((x) => ({ id: x.id, name: x.name }))}
            allLabel="Any subject"
          />
          <SelectFilter label="Filter by topic" value={topicFilter} onChange={setTopicFilter} options={filterTopics} allLabel="Any topic" />
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStreamFilter("");
                setSubjectFilter("");
                setTopicFilter("");
              }}
              className="text-sm text-slate-500 underline hover:text-slate-800"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-sm text-slate-500">
            {visible.length} of {data.length}
          </span>
        </div>
      )}

      {data && data.length > 0 && visible.length === 0 && <p className="card p-6 text-sm text-slate-500">No datasets match these filters.</p>}

      {data && visible.length > 0 && (
        <div className="overflow-x-auto card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Topics</th>
                <th className="px-4 py-2">Version</th>
                <th className="px-4 py-2">First imported</th>
                <th className="px-4 py-2 text-right">Questions</th>
                <th className="px-4 py-2 text-right">Active</th>
                <th className="px-4 py-2 text-right">Retired</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => {
                const retired = d.questionCount - d.activeQuestionCount;
                const canToggle = d.activeQuestionCount > 0 || retired > 0;
                return (
                  <tr key={d.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 font-medium text-slate-800">{d.name}</td>
                    <td className="px-4 py-2">
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {d.topics.slice(0, 4).map((t) => (
                          <Link key={t.topicId} to={`/admin/questions?topic=${t.topicId}&dataset=${d.id}`} title={`${t.questionCount} questions`}>
                            <Badge tone="indigo">
                              {t.subjectName ? `${t.subjectName} › ` : ""}
                              {t.topicName}
                            </Badge>
                          </Link>
                        ))}
                        {d.topics.length > 4 && <Badge tone="slate">+{d.topics.length - 4} more</Badge>}
                        {d.topics.length === 0 && <span className="text-xs text-slate-400">No questions</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{d.version}</td>
                    <td className="px-4 py-2 text-slate-600">{formatDateTime(d.importedAt)}</td>
                    <td className="px-4 py-2 text-right text-slate-800">{d.questionCount}</td>
                    <td className="px-4 py-2 text-right text-green-600">{d.activeQuestionCount}</td>
                    <td className="px-4 py-2 text-right text-amber-600">{retired}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {canToggle && (
                        <button
                          type="button"
                          disabled={toggleMutation.isPending}
                          onClick={() => handleToggle(d)}
                          className="mr-3 text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                        >
                          {d.activeQuestionCount > 0 ? "Retire all" : "Restore all"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openMove(d)}
                        className="mr-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Move to topic
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteDialog(d)}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={moving !== null}
        title="Move dataset to a topic"
        tone="info"
        confirmLabel={moveMutation.isPending ? "Moving..." : "Move questions"}
        onConfirm={moveSubject && moveTopic ? () => moveMutation.mutate() : undefined}
        onCancel={() => setMoving(null)}
        busy={moveMutation.isPending}
      >
        <p>
          All {moving?.questionCount} questions in <strong>{moving?.name}</strong> will be placed in the topic you choose. Student history stays attached to the questions.
        </p>
        <select aria-label="Subject to move into" className={inputClass} value={moveSubject} onChange={(e) => { setMoveSubject(e.target.value); setMoveTopic(""); }}>
          <option value="">Choose a subject</option>
          {catalog?.subjects.filter((x) => x.active).map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        <select aria-label="Topic to move into" className={inputClass} value={moveTopic} onChange={(e) => setMoveTopic(e.target.value)} disabled={!moveSubject}>
          <option value="">Choose a topic</option>
          {moveSubjectTopics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {!(moveSubject && moveTopic) && <p className="text-xs text-slate-400">Pick a subject and a topic to enable the move.</p>}
      </ConfirmDialog>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-800">Delete dataset</h2>
            <p className="text-sm text-slate-600">
              This permanently deletes <span className="font-semibold">{deleting.name}</span>. It cannot be undone. If you
              only want students to stop seeing these questions, use "Retire all" instead.
            </p>

            <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {impactQuery.isLoading && "Checking what will be removed..."}
              {impactQuery.isError && "Could not load the impact summary."}
              {impact && (
                <ul className="list-disc space-y-0.5 pl-5">
                  <li>{impact.questions} questions</li>
                  <li>{impact.attempts} student answers</li>
                  <li>{impact.progressRows} student progress records</li>
                  <li>{impact.sessionEntries} practice-session entries</li>
                </ul>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600">
                Type the dataset name to confirm:
              </label>
              <input
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder={deleting.name}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteDialog}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!nameMatches || deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleting)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
