import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, ListChecks, Shuffle, ToggleLeft, Type, Zap } from "lucide-react";
import { messageFromError } from "../../admin/utils/format";
import { primaryButton } from "../../../components/ui/styles";
import { useStudentCatalog } from "../../catalog/hooks/useStudentCatalog";
import { startFast } from "../api/practiceApi";

const COUNTS = [5, 10, 15, 20, 30];

const DIFFICULTIES = [
  { value: "", label: "Any", active: "from-slate-600 to-slate-700" },
  { value: "EASY", label: "Easy", active: "from-emerald-500 to-teal-500" },
  { value: "MEDIUM", label: "Medium", active: "from-amber-500 to-orange-500" },
  { value: "HARD", label: "Hard", active: "from-rose-500 to-pink-500" },
  { value: "EXPERT", label: "Expert", active: "from-violet-600 to-purple-700" },
];

const TYPES = [
  { value: "", label: "Mixed", icon: Shuffle },
  { value: "MCQ", label: "Multiple choice", icon: ListChecks },
  { value: "TRUE_FALSE", label: "True / False", icon: ToggleLeft },
  { value: "FILL_IN_BLANK", label: "Fill in the blank", icon: Type },
];

function chip(active: boolean) {
  return `rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
    active
      ? "border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200"
      : "border-slate-200 bg-white/80 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
  }`;
}

export function FastPracticeForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [count, setCount] = useState(10);
  const [params] = useSearchParams();
  const [streamId, setStreamId] = useState(params.get("stream") ?? "");
  const [subjectId, setSubjectId] = useState(params.get("subject") ?? "");
  const [topicId, setTopicId] = useState(params.get("topic") ?? "");
  const [difficulty, setDifficulty] = useState("");
  const [questionType, setQuestionType] = useState("");

  const { data: catalog } = useStudentCatalog();
  const subjects = (catalog?.subjects ?? []).filter((s) => !streamId || s.streamIds.includes(streamId));
  const subject = subjects.find((s) => s.id === subjectId);
  const safeTopicId = subject?.topics.some((t) => t.id === topicId) ? topicId : "";

  const mutation = useMutation({
    mutationFn: startFast,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["active-session"] });
      navigate(`/practice/session/${session.sessionId}`);
    },
  });

  const topicName = subject
    ? subject.topics.find((t) => t.id === topicId)?.name ?? `any topic in ${subject.name}`
    : streamId
      ? `any ${catalog?.streams.find((s) => s.id === streamId)?.name ?? "stream"} subject`
      : "any topic";
  const typeLabel = TYPES.find((t) => t.value === questionType)?.label.toLowerCase() ?? "mixed";
  const diffLabel = DIFFICULTIES.find((d) => d.value === difficulty)?.label.toLowerCase() ?? "any";

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate({
          count,
          topicId: safeTopicId || null,
          subjectId: safeTopicId || !subject ? null : subject.id,
          difficulty: difficulty || null,
          questionType: questionType || null,
        });
      }}
    >
      <section>
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-slate-700">How many questions?</h3>
          <span className="text-2xl font-semibold text-indigo-600">{count}</span>
        </div>
        <input
          type="range"
          min={1}
          max={50}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="mt-2 w-full accent-indigo-600"
          aria-label="Number of questions"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {COUNTS.map((c) => (
            <button type="button" key={c} onClick={() => setCount(c)} className={chip(count === c)}>
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        {(catalog?.streams.length ?? 0) > 1 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Stream</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setStreamId("");
                  setSubjectId("");
                  setTopicId("");
                }}
                className={chip(streamId === "")}
              >
                All streams
              </button>
              {catalog?.streams.map((st) => (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => {
                    setStreamId(st.id);
                    setSubjectId("");
                    setTopicId("");
                  }}
                  className={chip(streamId === st.id)}
                >
                  {st.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-slate-700">Subject</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSubjectId("");
                setTopicId("");
              }}
              className={chip(subjectId === "")}
            >
              All subjects
            </button>
            {subjects.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => {
                  setSubjectId(s.id);
                  setTopicId("");
                }}
                className={chip(subjectId === s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {subject && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Topic in {subject.name}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => setTopicId("")} className={chip(topicId === "")}>
                All topics
              </button>
              {subject.topics.map((t) => (
                <button type="button" key={t.id} onClick={() => setTopicId(t.id)} className={chip(topicId === t.id)}>
                  {t.name}
                  <span className="ml-1.5 text-xs opacity-70">{t.activeQuestionCount}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-700">Difficulty</h3>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              type="button"
              key={d.label}
              onClick={() => setDifficulty(d.value)}
              className={`rounded-xl px-2 py-2 text-sm font-medium transition ${
                difficulty === d.value
                  ? `bg-gradient-to-br ${d.active} text-white shadow-md`
                  : "border border-slate-200 bg-white/80 text-slate-600 hover:border-indigo-300"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-700">Question type</h3>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TYPES.map(({ value, label, icon: Icon }) => {
            const active = questionType === value;
            return (
              <button
                type="button"
                key={label}
                onClick={() => setQuestionType(value)}
                className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                  active
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                    : "border-slate-200 bg-white/80 text-slate-600 hover:border-indigo-300"
                }`}
              >
                {active && <Check size={12} className="absolute right-2 top-2" />}
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="rounded-xl bg-indigo-50/80 px-4 py-3 text-sm text-slate-600">
        <Zap size={14} className="mr-1 inline text-indigo-500" />
        <strong className="text-slate-800">{count}</strong> {typeLabel} questions on{" "}
        <strong className="text-slate-800">{topicName}</strong>, difficulty <strong className="text-slate-800">{diffLabel}</strong>.
        Fast Practice doesn't affect your streak.
      </div>

      {mutation.isError && <p className="text-sm text-red-600">{messageFromError(mutation.error)}</p>}

      <button type="submit" disabled={mutation.isPending} className={`${primaryButton} w-full py-3 text-base`}>
        {mutation.isPending ? "Starting..." : "Start Fast Practice"}
      </button>
    </form>
  );
}
