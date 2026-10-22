import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { messageFromError } from "../utils/format";
import { Chip } from "../../../components/ui/Chip";
import { secondaryButton } from "../../../components/ui/styles";
import { formatDateTime } from "../../../lib/format";
import { KIND_LABELS, listAdminRequests, setRequestStatus } from "../../help/api/helpApi";
import type { SupportStatus } from "../../help/api/helpApi";

const FILTERS: { value: SupportStatus | ""; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "DONE", label: "Done" },
  { value: "", label: "All" },
];

export function SupportRequestsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SupportStatus | "">("OPEN");
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-support", status, page],
    queryFn: () => listAdminRequests(status, page),
  });

  const mutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: SupportStatus }) => setRequestStatus(id, next),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-support"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-slate-500">From your students</p>
        <h1 className="font-display text-[clamp(28px,4vw,40px)] font-extrabold leading-tight text-slate-800">Requests</h1>
        <p className="text-sm text-slate-500">Topic requests, feedback and problems sent by students.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            type="button"
            key={f.label}
            onClick={() => {
              setStatus(f.value);
              setPage(0);
            }}
            aria-pressed={status === f.value}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition ${
              status === f.value
                ? "border-amber-400 bg-amber-300 text-slate-900"
                : "border-slate-300 bg-slate-100 text-slate-600 hover:border-indigo-400"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card p-5">
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : isError || !data ? (
          <p className="text-sm text-red-600">Could not load requests. Try refreshing.</p>
        ) : data.content.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing here.</p>
        ) : (
          <>
            <ul className="divide-y-2 divide-slate-200">
              {data.content.map((r) => (
                <li key={r.id} className="py-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone={r.kind === "BUG" ? "bad" : r.kind === "TOPIC_REQUEST" ? "pri" : "neutral"}>{KIND_LABELS[r.kind]}</Chip>
                    {r.status === "DONE" && <Chip tone="good">Done</Chip>}
                    {r.subject && <span className="font-bold text-slate-800">{r.subject}</span>}
                    <span className="text-xs text-slate-400">
                      @{r.username} · {formatDateTime(r.createdAt)}
                    </span>
                    <button
                      type="button"
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate({ id: r.id, next: r.status === "OPEN" ? "DONE" : "OPEN" })}
                      className={`${secondaryButton} ml-auto`}
                    >
                      {r.status === "OPEN" ? "Mark done" : "Reopen"}
                    </button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-slate-600">{r.message}</p>
                </li>
              ))}
            </ul>
            {mutation.isError && <p className="mt-3 text-sm text-red-600">{messageFromError(mutation.error)}</p>}

            {data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className={secondaryButton}>
                  Previous
                </button>
                <span>
                  Page {data.page + 1} of {data.totalPages}
                </span>
                <button onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= data.totalPages} className={secondaryButton}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
