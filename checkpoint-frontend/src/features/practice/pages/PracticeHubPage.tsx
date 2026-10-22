import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, CheckCircle2, Flame, Zap } from "lucide-react";
import { messageFromError } from "../../admin/utils/format";
import { Mascot } from "../../../components/mascot/Mascot";
import { useEquippedSkin } from "../../rewards/hooks/useRewards";
import { Chip } from "../../../components/ui/Chip";
import { primaryButton } from "../../../components/ui/styles";
import { plural } from "../../../lib/format";
import { getDashboard } from "../../progress/api/progressApi";
import { getActiveSession, startDaily } from "../api/practiceApi";
import { FastPracticeForm } from "../components/FastPracticeForm";

export function PracticeHubPage() {
  const skin = useEquippedSkin();
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
        <Mascot skin={skin} mood="hype" size={96} className="mx-auto" />
        <h1 className="mt-2 font-display text-2xl font-bold text-slate-800">You have a session in progress</h1>
        <p className="mt-1 text-sm text-slate-500">Finish it before starting a new one.</p>
        <Link to={`/practice/session/${active.sessionId}`} className={`${primaryButton} mt-4`}>
          Resume session
        </Link>
      </div>
    );
  }

  const doneToday = dashboard?.dailySessionCompletedToday ?? false;
  const streak = dashboard?.currentStreak ?? 0;

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-semibold text-slate-500">Pick how you want to train</p>
        <h1 className="font-display text-[clamp(28px,4vw,40px)] font-extrabold leading-tight text-slate-800">Practice</h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <div className="hero-card relative flex flex-col p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/25 text-white">
              {doneToday ? <CheckCircle2 size={24} /> : <BookOpen size={24} />}
            </div>
            <Mascot skin={skin} mood={doneToday ? "proud" : "idle"} size={84} className="-mt-1" />
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">Daily Session</h2>

          {doneToday ? (
            <>
              <p className="mt-1 text-sm font-bold text-white">Done for today. Nice work!</p>
              <p className="mt-2 text-sm text-white/95">
                Your next Daily Session unlocks tomorrow (the day changes at 5:30 AM IST). Fast Practice is open any time.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-white/90">
              Questions picked from your interests, prioritising what you need to review most. Completing it keeps your streak alive.
            </p>
          )}

          <div className="mt-4 flex w-fit items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-sm font-bold text-white">
            <Flame size={16} /> {plural(streak, "day")} streak
          </div>

          <div className="mt-auto pt-6">
            <button
              onClick={() => startDailyMutation.mutate()}
              disabled={doneToday || startDailyMutation.isPending}
              className="btn-white w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {doneToday ? "Completed today" : startDailyMutation.isPending ? "Starting..." : "Start Daily Session"}
            </button>
            {startDailyMutation.isError && (
              <p className="mt-2 text-xs font-bold text-white">{messageFromError(startDailyMutation.error)}</p>
            )}
          </div>
        </div>

        <div className="card p-6 xl:col-span-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-slate-900">
              <Zap size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-bold text-slate-800">Fast Practice</h2>
              <p className="text-sm text-slate-500">Build your own quick session.</p>
            </div>
            <span className="hidden sm:block">
              <Chip tone="neutral">Keys 1 to 4 to answer</Chip>
            </span>
          </div>
          <div className="mt-6">
            <FastPracticeForm />
          </div>
        </div>
      </div>
    </div>
  );
}
