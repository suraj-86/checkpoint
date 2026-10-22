import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { inputClass, labelClass } from "@/components/ui/styles";
import { getCatalog } from "../api/catalogApi";
import { getSubtopics, organiseSubject } from "../api/organiseApi";
import { messageFromError } from "../utils/format";

interface Choice {
  checked: boolean;
  topicName: string;
}

export function OrganisePage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [subjectId, setSubjectId] = useState("");
  const [minCount, setMinCount] = useState(5);
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [confirming, setConfirming] = useState(false);

  const catalog = useQuery({ queryKey: ["admin-catalog"], queryFn: getCatalog });
  const preview = useQuery({
    queryKey: ["admin-subtopics", subjectId],
    queryFn: () => getSubtopics(subjectId),
    enabled: !!subjectId,
  });

  const rows = useMemo(() => preview.data?.subtopics ?? [], [preview.data]);

  useEffect(() => {
    const next: Record<string, Choice> = {};
    for (const r of rows) {
      next[r.key] = { checked: r.count >= minCount, topicName: r.label };
    }
    setChoices(next);
  }, [rows, minCount]);

  const selected = rows.filter((r) => choices[r.key]?.checked && choices[r.key].topicName.trim());
  const selectedQuestions = selected.reduce((sum, r) => sum + r.count, 0);

  const mutation = useMutation({
    mutationFn: () =>
      organiseSubject(
        subjectId,
        selected.map((r) => ({ subtopic: r.key, topicName: choices[r.key].topicName.trim() })),
      ),
    onSuccess: (result) => {
      setConfirming(false);
      toast(
        `Moved ${result.moved} questions` + (result.topicsCreated.length ? `, created ${result.topicsCreated.length} new topics` : ""),
        "good",
      );
      for (const key of ["admin-catalog", "admin-subtopics", "student-catalog", "progress-mastery", "topics", "admin-dashboard", "admin-questions"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
    onError: (e) => {
      setConfirming(false);
      toast(messageFromError(e), "bad");
    },
  });

  function update(key: string, patch: Partial<Choice>) {
    setChoices((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Organise by subtopic</h1>
        <p className="text-sm text-slate-500">
          Older questions all sit in a subject's "General" topic. Pick a subject, then turn its subtopics into real topics. Questions are moved, never
          copied or deleted, and progress is kept.
        </p>
      </div>

      <div className="card grid gap-3 p-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="org-subject">
            Subject
          </label>
          <select id="org-subject" className={inputClass} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Choose a subject</option>
            {(catalog.data?.subjects ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="org-min">
            Pre-tick subtopics with at least this many questions
          </label>
          <input id="org-min" type="number" min={1} max={500} className={inputClass} value={minCount} onChange={(e) => setMinCount(Math.max(1, Number(e.target.value) || 1))} />
        </div>
      </div>

      {preview.isLoading && <p className="text-sm text-slate-500">Loading subtopics...</p>}
      {preview.isError && <p className="text-sm font-semibold text-rose-600">{messageFromError(preview.error)}</p>}

      {preview.data && (
        <section className="card p-4">
          <p className="text-sm font-semibold text-slate-600">
            {preview.data.generalQuestions.toLocaleString()} questions in "General", {preview.data.withoutSubtopic.toLocaleString()} without a subtopic
            (these stay). Existing topics: {preview.data.existingTopics.length ? preview.data.existingTopics.join(", ") : "none"}.
          </p>

          {rows.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nothing to organise in this subject.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    <th className="pb-2 pr-3">Move</th>
                    <th className="pb-2 pr-3">Subtopic in file</th>
                    <th className="pb-2 pr-3">Questions</th>
                    <th className="pb-2">Topic name</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const c = choices[r.key] ?? { checked: false, topicName: r.label };
                    return (
                      <tr key={r.key} className="border-t border-slate-200">
                        <td className="py-2 pr-3">
                          <input type="checkbox" checked={c.checked} onChange={(e) => update(r.key, { checked: e.target.checked })} aria-label={`Move ${r.label}`} />
                        </td>
                        <td className="py-2 pr-3 text-sm font-semibold text-slate-700">{r.label}</td>
                        <td className="py-2 pr-3 text-sm font-semibold text-slate-600">{r.count}</td>
                        <td className="py-2">
                          <input className={inputClass} value={c.topicName} maxLength={80} onChange={(e) => update(r.key, { topicName: e.target.value })} aria-label={`Topic name for ${r.label}`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className="btn-primary" disabled={selected.length === 0 || mutation.isPending} onClick={() => setConfirming(true)}>
              Move {selectedQuestions.toLocaleString()} questions
            </button>
            <span className="text-sm text-slate-500">{selected.length} subtopics selected</span>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirming}
        title="Move questions into topics?"
        tone="warning"
        confirmLabel="Move"
        busy={mutation.isPending}
        onConfirm={() => mutation.mutate()}
        onCancel={() => setConfirming(false)}
      >
        {selectedQuestions.toLocaleString()} questions will move out of "General" into {selected.length} topics. Missing topics are created. Student
        progress is kept. Nothing is deleted.
      </ConfirmDialog>
    </div>
  );
}
