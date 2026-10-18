import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { inputClass } from "../../../components/ui/styles";
import { useStudentCatalog } from "../../catalog/hooks/useStudentCatalog";
import { getPreferences, savePreferences } from "../../preference/api/preferenceApi";
import { getInterests, saveInterests } from "../api/interestApi";

function same(a: string[], b: string[]): boolean {
  return a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",");
}

function chip(on: boolean) {
  return `rounded-full border px-3 py-1 text-sm transition-colors ${
    on ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
  }`;
}

export function InterestPicker() {
  const queryClient = useQueryClient();
  const { data: catalog } = useStudentCatalog();
  const { data: savedPrefs } = useQuery({ queryKey: ["preferences"], queryFn: getPreferences });
  const { data: savedInterests } = useQuery({ queryKey: ["interests"], queryFn: getInterests });

  const [streamId, setStreamId] = useState("");
  const [examId, setExamId] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (savedPrefs && savedInterests && !loaded) {
      setStreamId(savedPrefs.streamId ?? "");
      setExamId(savedPrefs.examId ?? "");
      setSubjectIds(savedPrefs.subjectIds);
      setTopicIds(savedInterests.topicIds);
      setLoaded(true);
    }
  }, [savedPrefs, savedInterests, loaded]);

  const subjects = catalog?.subjects ?? [];
  const exams = catalog?.exams ?? [];
  const streams = catalog?.streams ?? [];

  const examOptions = useMemo(() => {
    if (!streamId) return exams;
    const inStream = new Set(subjects.filter((s) => s.streamIds.includes(streamId)).map((s) => s.id));
    return exams.filter((e) => e.subjectIds.some((id) => inStream.has(id)));
  }, [exams, subjects, streamId]);

  const subjectOptions = useMemo(
    () =>
      subjects.filter((s) => {
        if (examId) return s.examIds.includes(examId);
        if (streamId) return s.streamIds.includes(streamId);
        return true;
      }),
    [subjects, streamId, examId]
  );

  const scopeSubjects = subjectIds.length > 0 ? subjectOptions.filter((s) => subjectIds.includes(s.id)) : subjectOptions;

  function clean(next: { stream: string; exam: string }) {
    const fitting = subjects.filter((s) => {
      if (next.exam) return s.examIds.includes(next.exam);
      if (next.stream) return s.streamIds.includes(next.stream);
      return true;
    });
    const keepSubjects = subjectIds.filter((id) => fitting.some((s) => s.id === id));
    const allowedTopics = new Set(
      (keepSubjects.length > 0 ? fitting.filter((s) => keepSubjects.includes(s.id)) : fitting).flatMap((s) => s.topics.map((t) => t.id))
    );
    setSubjectIds(keepSubjects);
    setTopicIds((prev) => prev.filter((id) => allowedTopics.has(id)));
  }

  function changeStream(value: string) {
    setJustSaved(false);
    let nextExam = examId;
    if (value && examId) {
      const inStream = new Set(subjects.filter((s) => s.streamIds.includes(value)).map((s) => s.id));
      const exam = exams.find((e) => e.id === examId);
      if (!exam || !exam.subjectIds.some((id) => inStream.has(id))) nextExam = "";
    }
    setStreamId(value);
    setExamId(nextExam);
    clean({ stream: value, exam: nextExam });
  }

  function changeExam(value: string) {
    setJustSaved(false);
    setExamId(value);
    clean({ stream: streamId, exam: value });
  }

  function toggleSubject(id: string) {
    setJustSaved(false);
    const next = subjectIds.includes(id) ? subjectIds.filter((x) => x !== id) : [...subjectIds, id];
    setSubjectIds(next);
    const scope = next.length > 0 ? subjectOptions.filter((s) => next.includes(s.id)) : subjectOptions;
    const allowed = new Set(scope.flatMap((s) => s.topics.map((t) => t.id)));
    setTopicIds((prev) => prev.filter((t) => allowed.has(t)));
  }

  function toggleTopic(id: string) {
    setJustSaved(false);
    setTopicIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function clearAll() {
    setJustSaved(false);
    setStreamId("");
    setExamId("");
    setSubjectIds([]);
    setTopicIds([]);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const prefs = await savePreferences({ streamId: streamId || null, examId: examId || null, subjectIds });
      const interests = await saveInterests(topicIds);
      return { prefs, interests };
    },
    onSuccess: ({ prefs, interests }) => {
      queryClient.setQueryData(["preferences"], prefs);
      queryClient.setQueryData(["interests"], interests);
      setJustSaved(true);
    },
  });

  const unchanged =
    !savedPrefs ||
    !savedInterests ||
    ((savedPrefs.streamId ?? "") === streamId &&
      (savedPrefs.examId ?? "") === examId &&
      same(savedPrefs.subjectIds, subjectIds) &&
      same(savedInterests.topicIds, topicIds));

  const anything = streamId !== "" || examId !== "" || subjectIds.length > 0 || topicIds.length > 0;

  let summary = "Daily Sessions will include every topic.";
  if (topicIds.length > 0) summary = `Daily Sessions will use your ${topicIds.length} chosen topic${topicIds.length === 1 ? "" : "s"}.`;
  else if (subjectIds.length > 0) summary = `Daily Sessions will use every topic in your ${subjectIds.length} chosen subject${subjectIds.length === 1 ? "" : "s"}.`;
  else if (examId) summary = `Daily Sessions will use the subjects of ${exams.find((e) => e.id === examId)?.name ?? "your exam"}.`;
  else if (streamId) summary = `Daily Sessions will use the subjects of ${streams.find((s) => s.id === streamId)?.name ?? "your stream"}.`;

  return (
    <div className="card p-6">
      <h2 className="text-base font-semibold text-slate-800">What I want to practise</h2>
      <p className="mt-1 text-sm text-slate-500">
        Choose as little or as much as you like. The more specific your choice, the more focused your Daily Sessions.
      </p>

      {!catalog ? (
        <p className="mt-3 text-sm text-slate-400">Loading...</p>
      ) : (
        <div className="mt-4 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="pref-stream" className="mb-1 block text-sm font-medium text-slate-700">
                Stream
              </label>
              <select id="pref-stream" className={inputClass} value={streamId} onChange={(e) => changeStream(e.target.value)}>
                <option value="">Any stream</option>
                {streams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pref-exam" className="mb-1 block text-sm font-medium text-slate-700">
                Exam
              </label>
              <select id="pref-exam" className={inputClass} value={examId} onChange={(e) => changeExam(e.target.value)}>
                <option value="">Any exam</option>
                {examOptions.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700">
              Subjects <span className="font-normal text-slate-400">({subjectIds.length} selected)</span>
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {subjectOptions.length === 0 && <p className="text-sm text-slate-400">No subjects available yet.</p>}
              {subjectOptions.map((s) => {
                const on = subjectIds.includes(s.id);
                return (
                  <button key={s.id} type="button" aria-pressed={on} onClick={() => toggleSubject(s.id)} className={chip(on)}>
                    {on && <Check size={12} className="mr-1 inline" />}
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700">
              Topics <span className="font-normal text-slate-400">({topicIds.length} selected, optional)</span>
            </h3>
            <div className="mt-2 space-y-3">
              {scopeSubjects.map((s) => (
                <div key={s.id}>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">{s.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {s.topics.map((t) => {
                      const on = topicIds.includes(t.id);
                      return (
                        <button key={t.id} type="button" aria-pressed={on} onClick={() => toggleTopic(t.id)} className={chip(on)}>
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {scopeSubjects.length === 0 && <p className="text-sm text-slate-400">Pick a stream, exam or subject to see its topics.</p>}
            </div>
          </div>
        </div>
      )}

      <p className="mt-4 rounded-xl bg-indigo-50/80 px-3 py-2 text-sm text-slate-600">{summary}</p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={unchanged || saveMutation.isPending}
          className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {saveMutation.isPending ? "Saving..." : "Save"}
        </button>
        {anything && (
          <button type="button" onClick={clearAll} className="text-sm text-slate-500 underline hover:text-slate-800">
            Clear everything
          </button>
        )}
        {justSaved && <span className="text-sm text-green-600">Saved</span>}
        {saveMutation.isError && <span className="text-sm text-red-600">Could not save. Please try again.</span>}
      </div>
    </div>
  );
}
