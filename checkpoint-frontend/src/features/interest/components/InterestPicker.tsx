import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTopics } from "../../progress/api/progressApi";
import { getInterests, saveInterests } from "../api/interestApi";

function sameSelection(a: string[], b: string[]): boolean {
  return a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",");
}

export function InterestPicker() {
  const queryClient = useQueryClient();
  const { data: topics } = useQuery({ queryKey: ["topics"], queryFn: getTopics });
  const { data: saved } = useQuery({ queryKey: ["interests"], queryFn: getInterests });

  const [selected, setSelected] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (saved && !loaded) {
      setSelected(saved.topicIds);
      setLoaded(true);
    }
  }, [saved, loaded]);

  const saveMutation = useMutation({
    mutationFn: () => saveInterests(selected),
    onSuccess: (result) => {
      queryClient.setQueryData(["interests"], result);
      setJustSaved(true);
    },
  });

  function toggle(topicId: string) {
    setJustSaved(false);
    setSelected((prev) => (prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]));
  }

  const unchanged = saved ? sameSelection(saved.topicIds, selected) : true;

  return (
    <div className="card p-6">
      <h2 className="text-base font-semibold text-slate-800">Topics I want to practice</h2>
      <p className="mt-1 text-sm text-slate-500">
        Your Daily Sessions will use these topics. If none are selected, every topic is included.
      </p>

      {!topics ? (
        <p className="mt-3 text-sm text-slate-400">Loading...</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {topics.map((t) => {
            const on = selected.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(t.id)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  on
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={unchanged || saveMutation.isPending}
          className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {saveMutation.isPending ? "Saving..." : "Save topics"}
        </button>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setJustSaved(false);
              setSelected([]);
            }}
            className="text-sm text-slate-500 underline hover:text-slate-800"
          >
            Clear selection
          </button>
        )}
        {justSaved && <span className="text-sm text-green-600">Saved</span>}
        {saveMutation.isError && <span className="text-sm text-red-600">Could not save. Please try again.</span>}
      </div>
    </div>
  );
}
