import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { messageFromError } from "../utils/format";
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
        <h1 className="text-2xl font-semibold text-slate-800">Requests</h1>
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
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              status === f.value
                ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                : "border-slate-200 bg-white/80 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
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
            <ul className="divide-y divide-slate-100">
              {data.content.map((r) => (
                <li key={r.id} className="py-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">{KIND_LABELS[r.kind]}</span>
                    {r.subject && <span className="font-medium text-slate-800">{r.subject}</span>}
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
