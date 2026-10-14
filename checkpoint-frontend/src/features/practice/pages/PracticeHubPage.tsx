import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, CheckCircle2, Flame, Zap } from "lucide-react";
import { messageFromError } from "../../admin/utils/format";
import { primaryButton } from "../../../components/ui/styles";
import { plural } from "../../../lib/format";
import { getDashboard } from "../../progress/api/progressApi";
import { getActiveSession, startDaily } from "../api/practiceApi";
import { FastPracticeForm } from "../components/FastPracticeForm";

export function PracticeHubPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cachedActive, isError: noActiveSession } = useQuery({ queryKey: ["active-session"], queryFn: getActiveSession, retry: false });
  const active = noActiveSession ? undefined : cachedActive;
  const { data: dashboard } = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });

  const startDailyMutation = useMutation({
    mutationFn: startDaily,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["active-session"] });
      navigate(`/practice/session/${session.sessionId}`);
    },
    onError: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  if (active) {
    return (
      <div className="mx-auto max-w-md card p-6 text-center">
        <h1 className="text-lg font-semibold text-slate-800">You have a session in progress</h1>
        <p className="mt-1 text-sm text-slate-500">Finish it before starting a new one.</p>
        <Link to={`/practice/session/${active.sessionId}`} className={`${primaryButton} mt-4 inline-block`}>
          Resume session
        </Link>
      </div>
    );
  }

  const doneToday = dashboard?.dailySessionCompletedToday ?? false;
  const streak = dashboard?.currentStreak ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Practice</h1>
        <p className="text-sm text-slate-500">Build your streak with the Daily Session, or train on your own terms.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card flex flex-col p-6 lg:col-span-2">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md ${
              doneToday
                ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-200"
                : "bg-gradient-to-br from-indigo-500 to-violet-500 shadow-indigo-200"
            }`}
          >
            {doneToday ? <CheckCircle2 size={24} /> : <BookOpen size={24} />}
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-800">Daily Session</h2>

          {doneToday ? (
            <>
              <p className="mt-1 text-sm font-medium text-emerald-600">Done for today. Nice work!</p>
              <p className="mt-2 text-sm text-slate-500">
                Your next Daily Session unlocks tomorrow (the day changes at midnight UTC). Fast Practice is open any time.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              10 questions picked from your interests, prioritising what you need to review most. Completing it keeps your streak alive.
            </p>
          )}

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <Flame size={16} /> {plural(streak, "day")} streak
          </div>

          <div className="mt-auto pt-5">
            <button
              onClick={() => startDailyMutation.mutate()}
              disabled={doneToday || startDailyMutation.isPending}
              className={`${primaryButton} w-full disabled:cursor-not-allowed`}
            >
              {doneToday ? "Completed today" : startDailyMutation.isPending ? "Starting..." : "Start Daily Session"}
            </button>
            {startDailyMutation.isError && (
              <p className="mt-2 text-xs text-red-600">{messageFromError(startDailyMutation.error)}</p>
            )}
          </div>
        </div>

        <div className="card p-6 lg:col-span-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-200">
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Fast Practice</h2>
              <p className="text-sm text-slate-500">Build your own quick session.</p>
            </div>
          </div>
          <div className="mt-6">
            <FastPracticeForm />
          </div>
        </div>
      </div>
    </div>
  );
}
