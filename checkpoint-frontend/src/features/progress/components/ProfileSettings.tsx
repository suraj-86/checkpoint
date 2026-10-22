import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ThemeSwitcher } from "../../../components/ThemeSwitcher";
import { useToast } from "../../../components/ui/Toast";
import { getSettings, saveSettings, type UserSettings } from "../../../lib/settingsApi";
import { useTheme } from "../../../lib/theme";

const MIN = 5;
const MAX = 20;
const DEFAULT_SIZE = 10;

/** Look and feel plus how long a Daily Session is. Saved to the account. */
export function ProfileSettings() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { soundEnabled, setSoundEnabled } = useTheme();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: getSettings, staleTime: Infinity });

  const saved = data?.dailySessionSize ?? DEFAULT_SIZE;
  const [size, setSize] = useState(saved);
  useEffect(() => setSize(saved), [saved]);

  const mutation = useMutation({
    mutationFn: (next: number) => saveSettings({ dailySessionSize: next }),
    onSuccess: (result: UserSettings) => {
      queryClient.setQueryData(["settings"], result);
      toast("Daily Session size saved.", "good");
    },
    onError: () => {
      setSize(saved);
      toast("Could not save that. Try again.", "bad");
    },
  });

  return (
    <div className="card space-y-5 p-5">
      <b className="text-sm text-slate-800">Settings</b>

      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">Theme</p>
        <div className="max-w-xs">
          <ThemeSwitcher />
        </div>
      </div>

      <label className="flex items-center justify-between gap-4">
        <span>
          <span className="block text-sm font-bold text-slate-800">Sound effects</span>
          <span className="text-xs text-slate-500">Off by default. Small sounds for answers and rewards.</span>
        </span>
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={(e) => setSoundEnabled(e.target.checked)}
          className="h-5 w-5 accent-indigo-500"
        />
      </label>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="daily-size" className="text-sm font-bold text-slate-800">
            Daily Session size
          </label>
          <b className="text-sm text-indigo-600">{size} questions</b>
        </div>
        <input
          id="daily-size"
          type="range"
          min={MIN}
          max={MAX}
          step={1}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          onPointerUp={() => size !== saved && mutation.mutate(size)}
          onKeyUp={() => size !== saved && mutation.mutate(size)}
          disabled={!data || mutation.isPending}
          className="mt-2 w-full accent-indigo-500"
        />
        <p className="mt-1 text-xs text-slate-500">
          {MIN} to {MAX}. Applies to your next Daily Session; one already started keeps its size.
        </p>
      </div>
    </div>
  );
}
