import { Award } from "lucide-react";
import { useEffect, useState } from "react";
import type { LevelProgress } from "../../features/progress/types/progress.types";

export function LevelProgressCard({ totalXp, progress }: { totalXp: number; progress: LevelProgress }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(progress.percent), 60);
    return () => clearTimeout(t);
  }, [progress.percent]);

  const maxed = progress.nextLevelXp === null;
  const span = maxed ? 0 : (progress.nextLevelXp as number) - progress.currentLevelXp;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200">
            <Award size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Current level</p>
            <p className="text-xl font-semibold text-slate-800">Level {progress.level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total XP</p>
          <p className="text-xl font-semibold text-slate-800">{totalXp.toLocaleString()}</p>
        </div>
      </div>

      <div
        className="mt-5 h-3.5 overflow-hidden rounded-full bg-indigo-100"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        title={`${progress.percent}% to the next level`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        {maxed ? (
          <span>Max level reached</span>
        ) : (
          <>
            <span>
              {progress.xpIntoLevel.toLocaleString()} / {span.toLocaleString()} XP
            </span>
            <span className="font-medium text-indigo-600">
              {(progress.xpToNextLevel as number).toLocaleString()} XP to Level {progress.level + 1}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
