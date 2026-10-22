import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { inputClass, labelClass } from "@/components/ui/styles";
import { getCatalog } from "../api/catalogApi";
import { mergeTopics } from "../api/organiseApi";
import { messageFromError } from "../utils/format";

export function MergeTopicsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [subjectId, setSubjectId] = useState("");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [keepId, setKeepId] = useState("");
  const [newName, setNewName] = useState("");
  const [confirming, setConfirming] = useState(false);

  const catalog = useQuery({ queryKey: ["admin-catalog"], queryFn: getCatalog });
  const subject = catalog.data?.subjects.find((s) => s.id === subjectId);
  const topics = useMemo(
    () => [...(subject?.topics ?? [])].sort((a, b) => b.questionCount - a.questionCount || a.name.localeCompare(b.name)),
    [subject],
  );
  const shown = topics.filter((t) => t.name.toLowerCase().includes(search.trim().toLowerCase()));
  const chosen = useMemo(() => topics.filter((t) => picked.has(t.id)), [topics, picked]);
  const keep = chosen.find((t) => t.id === keepId);
  const others = chosen.filter((t) => t.id !== keepId);
  const movingQuestions = others.reduce((sum, t) => sum + t.questionCount, 0);

  useEffect(() => {
    setPicked(new Set());
    setKeepId("");
    setNewName("");
    setSearch("");
  }, [subjectId]);

  useEffect(() => {
    if (chosen.length === 0) {
      setKeepId("");
      return;
    }
    if (!chosen.some((t) => t.id === keepId)) {
      setKeepId(chosen[0].id);
    }
  }, [chosen, keepId]);

  useEffect(() => {
    setNewName(keep?.name ?? "");
  }, [keep?.id, keep?.name]);

  const mutation = useMutation({
    mutationFn: () =>
      mergeTopics(
        keepId,
        others.map((t) => t.id),
        newName.trim() === keep?.name ? "" : newName.trim(),
      ),
    onSuccess: (result) => {
      setConfirming(false);
      setPicked(new Set());
      toast(`Merged into "${result.topicName}": ${result.questionsMoved} questions moved, ${result.topicsRemoved} topics removed`, "good");
      for (const key of ["admin-catalog", "admin-subtopics", "student-catalog", "progress-mastery", "topics", "admin-dashboard", "admin-questions"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
    onError: (e) => {
      setConfirming(false);
      toast(messageFromError(e), "bad");
    },
  });

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Merge topics</h1>
        <p className="text-sm text-slate-500">
          Tick the topics that mean the same thing (for example Array and Arrays), choose the one to keep, and merge. Questions are moved, never
          deleted, and student progress is kept. The other topics are removed.
        </p>
      </div>

      <div className="card grid gap-3 p-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="merge-subject">
            Subject
          </label>
          <select id="merge-subject" className={inputClass} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Choose a subject</option>
            {(catalog.data?.subjects ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.topics.length} topics)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="merge-search">
            Find a topic
          </label>
          <input id="merge-search" className={inputClass} value={search} placeholder="Type to filter" onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {subject && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="card p-4">
            <p className="mb-2 text-sm font-semibold text-slate-600">
              {shown.length} of {topics.length} topics. {picked.size} ticked.
            </p>
            <ul className="divide-y divide-slate-200">
              {shown.map((t) => (
                <li key={t.id}>
                  <label className="flex cursor-pointer items-center gap-3 py-2">
                    <input type="checkbox" checked={picked.has(t.id)} onChange={() => toggle(t.id)} />
                    <span className="flex-1 text-sm font-semibold text-slate-700">{t.name}</span>
                    <span className="text-sm font-semibold text-slate-500">{t.questionCount} questions</span>
                  </label>
                </li>
              ))}
            </ul>
            {shown.length === 0 && <p className="text-sm text-slate-500">No topics match.</p>}
          </section>

          <section className="card h-fit space-y-3 p-4">
            <h2 className="font-display text-lg font-bold text-slate-800">Merge</h2>
            {chosen.length < 2 ? (
              <p className="text-sm text-slate-500">Tick at least two topics to merge.</p>
            ) : (
              <>
                <div>
                  <label className={labelClass} htmlFor="merge-keep">
                    Keep this topic
                  </label>
                  <select id="merge-keep" className={inputClass} value={keepId} onChange={(e) => setKeepId(e.target.value)}>
                    {chosen.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.questionCount})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="merge-name">
                    Name after merging
                  </label>
                  <input id="merge-name" className={inputClass} value={newName} maxLength={80} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <button className="btn-primary w-full" disabled={!keep || !newName.trim() || mutation.isPending} onClick={() => setConfirming(true)}>
                  Merge {others.length} into "{keep?.name}"
                </button>
              </>
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title="Merge these topics?"
        tone="warning"
        confirmLabel="Merge"
        busy={mutation.isPending}
        onConfirm={() => mutation.mutate()}
        onCancel={() => setConfirming(false)}
      >
        {movingQuestions.toLocaleString()} questions from {others.length} topics will move into "{newName.trim() || keep?.name}", and those {others.length} topics will be
        removed. Student progress is kept. This cannot be undone with one click.
      </ConfirmDialog>
    </div>
  );
}
