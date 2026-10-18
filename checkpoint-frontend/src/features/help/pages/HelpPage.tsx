import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { messageFromError } from "../../admin/utils/format";
import { inputClass, labelClass, primaryButton } from "../../../components/ui/styles";
import { formatDateTime } from "../../../lib/format";
import { KIND_LABELS, createSupportRequest, listMyRequests } from "../api/helpApi";
import type { SupportKind } from "../api/helpApi";

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is the Daily Session?",
    a: "Ten questions picked from the topics you chose, starting with the ones you are due to review. Finishing it keeps your streak alive. A new day starts at 5:30 AM IST.",
  },
  {
    q: "What is Fast Practice?",
    a: "A session you build yourself. Pick how many questions, then optionally narrow by stream, subject, topic, difficulty or question type. You can do as many as you like.",
  },
  {
    q: "How do I choose what I practise?",
    a: "Open Profile and use \"What I want to practise\". Specific topics win, then subjects, then an exam, then a stream. If you choose nothing, your Daily Session uses every topic.",
  },
  {
    q: "What do the colours on the mastery map mean?",
    a: "Grey is not started, blue is just started (fewer than three answers), red needs work (under 60% correct), amber is getting there (60 to 79%) and green is strong (80% or more). The ring shows how much of the topic you have tried.",
  },
  {
    q: "What does \"due for review\" mean?",
    a: "Questions you missed, or that are scheduled to come back so they stick. They are prioritised in your next Daily Session.",
  },
  {
    q: "How do XP and levels work?",
    a: "Each finished session adds or removes a little XP depending on how you did. Your level rises as your total XP grows, and everyone starts at Level 0.",
  },
  {
    q: "I cannot find the subject or topic I want.",
    a: "Tell us with the form below. Choose \"Request a topic\" and say what you would like to practise.",
  },
];

const KINDS: { value: SupportKind; label: string; hint: string; placeholder: string }[] = [
  { value: "TOPIC_REQUEST", label: "Request a topic", hint: "What do you want to practise?", placeholder: "e.g. Rust basics" },
  { value: "FEEDBACK", label: "Give feedback", hint: "What would make Checkpoint better?", placeholder: "Short summary" },
  { value: "BUG", label: "Report a problem", hint: "What went wrong, and where?", placeholder: "Short summary" },
];

const MAX = 1000;

export function HelpPage() {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<SupportKind>("TOPIC_REQUEST");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const { data: mine } = useQuery({ queryKey: ["help-requests"], queryFn: listMyRequests });

  const mutation = useMutation({
    mutationFn: createSupportRequest,
    onSuccess: () => {
      setSubject("");
      setMessage("");
      setSent(true);
      queryClient.invalidateQueries({ queryKey: ["help-requests"] });
    },
  });

  const current = KINDS.find((k) => k.value === kind) ?? KINDS[0];
  const tooShort = message.trim().length < 5;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Help</h1>
        <p className="text-sm text-slate-500">Quick answers, and a way to tell us what you need.</p>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700">Common questions</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-slate-800">
                {item.q}
                <ChevronDown size={16} className="shrink-0 text-slate-400 transition group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-sm text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700">Tell us</h2>
        <form
          className="mt-3 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(false);
            mutation.mutate({ kind, subject, message });
          }}
        >
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button
                type="button"
                key={k.value}
                onClick={() => {
                  setKind(k.value);
                  setSent(false);
                }}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  kind === k.value
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                    : "border-slate-200 bg-white/80 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="help-subject" className={labelClass}>
              Title (optional)
            </label>
            <input
              id="help-subject"
              value={subject}
              maxLength={100}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={current.placeholder}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="help-message" className={labelClass}>
              {current.hint}
            </label>
            <textarea
              id="help-message"
              value={message}
              maxLength={MAX}
              rows={5}
              onChange={(e) => setMessage(e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {message.length} / {MAX}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={tooShort || mutation.isPending} className={primaryButton}>
              {mutation.isPending ? "Sending..." : "Send"}
            </button>
            {sent && <span className="text-sm text-emerald-600">Thanks! We have got it.</span>}
            {mutation.isError && <span className="text-sm text-red-600">{messageFromError(mutation.error)}</span>}
          </div>
        </form>
      </div>

      {mine && mine.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700">Your requests</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {mine.map((r) => (
              <li key={r.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">{KIND_LABELS[r.kind]}</span>
                  {r.subject && <span className="font-medium text-slate-800">{r.subject}</span>}
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.status === "DONE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.status === "DONE" ? "Done" : "Open"}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-slate-600">{r.message}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDateTime(r.createdAt)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
