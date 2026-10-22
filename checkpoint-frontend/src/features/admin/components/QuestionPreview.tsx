import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Chip } from "../../../components/ui/Chip";
import type { AdminQuestion } from "../types/admin.types";
import { prettify } from "../utils/format";

export function QuestionPreview({ question }: { question: AdminQuestion }) {
  const [reveal, setReveal] = useState(false);
  const data = (question.answerData ?? {}) as Record<string, unknown>;
  const options = Array.isArray(data.options) ? (data.options as string[]) : null;
  const accepted = Array.isArray(data.acceptedAnswers) ? (data.acceptedAnswers as string[]) : null;
  const correct = data.correctAnswer;
  const isTrueFalse = question.questionType === "TRUE_FALSE";
  const isFill = question.questionType === "FILL_IN_BLANK";

  const isRight = (value: unknown) => reveal && String(value).trim() === String(correct).trim();
  const optionStyle = (right: boolean) =>
    right ? "border-emerald-500 bg-emerald-500/15 text-slate-800" : "border-slate-300 bg-white/70 text-slate-800";

  return (
    <div className="card mx-auto max-w-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="pri">{prettify(question.questionType)}</Chip>
          <Chip>{question.difficulty.toLowerCase()}</Chip>
          {!question.active && <Chip tone="warn">Retired</Chip>}
        </div>
        <button type="button" onClick={() => setReveal((v) => !v)} className="btn-secondary !px-3 !py-1 text-xs">
          {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
          {reveal ? "Hide answer" : "Show answer"}
        </button>
      </div>

      <p className="mt-4 whitespace-pre-wrap break-words font-display text-xl font-bold leading-snug text-slate-800">
        {question.questionText}
      </p>

      {options && (
        <ul className="mt-4 space-y-2">
          {options.map((o, i) => (
            <li
              key={`${i}-${o}`}
              className={`flex items-start gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-semibold ${optionStyle(isRight(o))}`}
            >
              <span className="kbd mt-0.5 shrink-0">{i + 1}</span>
              <span className="whitespace-pre-wrap break-words">{o}</span>
              {isRight(o) && <span className="ml-auto shrink-0 text-xs font-extrabold">Correct</span>}
            </li>
          ))}
        </ul>
      )}

      {isTrueFalse && (
        <div className="mt-4 flex gap-3">
          {[true, false].map((v) => (
            <div
              key={String(v)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-extrabold ${optionStyle(isRight(v))}`}
            >
              <span className="kbd">{v ? 1 : 2}</span>
              {v ? "True" : "False"}
            </div>
          ))}
        </div>
      )}

      {isFill && (
        <div className="mt-4">
          <div className="rounded-2xl border-2 border-slate-300 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-400">
            Type your answer
          </div>
          {reveal && (
            <p className="mt-2 rounded-2xl border-2 border-emerald-500 bg-emerald-500/15 px-4 py-2 text-sm font-bold text-slate-800">
              {[correct, ...(accepted ?? [])].filter((v) => v !== undefined && v !== null).map(String).join("  /  ")}
            </p>
          )}
        </div>
      )}

      {reveal && question.explanation && (
        <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
          <span className="font-extrabold text-slate-800">Explanation: </span>
          {question.explanation}
        </p>
      )}
    </div>
  );
}
