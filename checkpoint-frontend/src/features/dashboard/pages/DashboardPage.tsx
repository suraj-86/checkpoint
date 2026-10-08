import type { ElementType, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { Flame, Zap, BookMarked, CheckCircle2, Clock, ArrowRight, Play, Target, Trophy } from "lucide-react";
import { getDashboard } from "../../progress/api/progressApi";
import { startDaily } from "../../practice/api/practiceApi";

function StatCard({ icon: Icon, label, value, helper, tone }: {
  icon: ElementType; label: string; value: ReactNode; helper: string; tone: string;
}) {
  return <div className="cp-card cp-card-hover p-5">
    <div className="flex items-start justify-between">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
        tone === "indigo" ? "bg-indigo-50 text-indigo-600" : tone === "orange" ? "bg-orange-50 text-orange-600" : tone === "green" ? "bg-emerald-50 text-emerald-600" : "bg-violet-50 text-violet-600"
      }`}><Icon size={19}/></div>
    </div>
    <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
    <p className="mt-1 text-xs text-slate-400">{helper}</p>
  </div>;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });
  const startDailyMutation = useMutation({
    mutationFn: startDaily,
    onSuccess: (session) => { queryClient.invalidateQueries({ queryKey: ["dashboard"] }); navigate(`/practice/session/${session.sessionId}`); },
  });

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) return <div className="cp-card p-8 text-center"><p className="font-semibold text-red-600">Could not load your dashboard.</p><p className="mt-1 text-sm text-slate-400">Try refreshing the page.</p></div>;

  const completion = data.dailySessionCompletedToday ? 100 : data.hasActiveSession ? 70 : 0;

  return <div className="space-y-6">
    <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-semibold text-indigo-600">Your learning workspace</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {data.username} 👋</h1>
        <p className="mt-2 text-sm text-slate-500">Here's your snapshot. Keep the momentum going.</p>
      </div>
      <Link to="/practice" className="cp-button self-start md:self-auto"><Play size={16} fill="currentColor"/> Practice now</Link>
    </section>

    <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatCard icon={Zap} label="Total XP" value={data.totalXp.toLocaleString()} helper={`Level ${data.level} learner`} tone="indigo"/>
      <StatCard icon={Trophy} label="Current level" value={data.level} helper="Keep completing sessions" tone="violet"/>
      <StatCard icon={Flame} label="Current streak" value={`${data.currentStreak} days`} helper={data.currentStreak > 0 ? "You're on a roll" : "Start today"} tone="orange"/>
      <StatCard icon={BookMarked} label="Needs review" value={data.questionsNeedingReview} helper="Questions worth revisiting" tone="green"/>
    </section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.8fr)]">
      <div className="cp-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's checkpoint</p><h2 className="mt-1 text-xl font-bold text-slate-900">{data.hasActiveSession ? "Session in progress" : data.dailySessionCompletedToday ? "Daily session complete" : "Ready for today's session?"}</h2></div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Target size={21}/></div>
        </div>
        <div className="p-6">
          <div className="flex items-end justify-between"><div><p className="text-3xl font-bold text-slate-900">{completion}%</p><p className="mt-1 text-sm text-slate-400">Daily completion</p></div><span className="text-xs font-semibold text-slate-400">10 questions</span></div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all" style={{width:`${completion}%`}}/></div>
          {data.hasActiveSession ? <Link to="/practice/active" className="cp-button mt-6 w-full sm:w-auto">Resume session <ArrowRight size={16}/></Link>
          : data.dailySessionCompletedToday ? <Link to="/practice/fast" className="cp-button-secondary mt-6">Try Fast Practice <ArrowRight size={16}/></Link>
          : <button onClick={()=>startDailyMutation.mutate()} disabled={startDailyMutation.isPending} className="cp-button mt-6">{startDailyMutation.isPending ? "Starting..." : "Start Daily Session"} <ArrowRight size={16}/></button>}
          {startDailyMutation.isError && <p className="mt-3 text-sm text-red-600">Could not start a session. Please try again.</p>}
        </div>
      </div>

      <div className="cp-card p-6">
        <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Streak</p><h2 className="mt-1 text-xl font-bold text-slate-900">Stay consistent</h2></div><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500"><Flame size={22}/></div></div>
        <div className="mt-7 flex items-end gap-3"><span className="text-5xl font-black tracking-tight text-slate-900">{data.currentStreak}</span><span className="pb-1 text-sm font-semibold text-slate-400">days</span></div>
        <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Longest</p><p className="mt-1 font-bold text-slate-800">{data.longestStreak} days</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Today</p><p className="mt-1 font-bold text-emerald-600">{data.dailySessionCompletedToday ? "Done" : "Open"}</p></div></div>
      </div>
    </section>

    <section className="cp-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 className="font-bold text-slate-900">Recent sessions</h2><p className="mt-1 text-xs text-slate-400">Your latest practice activity</p></div><Link to="/progress" className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">View progress <ArrowRight size={15}/></Link></div>
      {data.recentSessions.length === 0 ? <div className="p-8 text-center"><Clock className="mx-auto text-slate-300" size={28}/><p className="mt-2 text-sm text-slate-500">No completed sessions yet.</p></div> :
        <div className="divide-y divide-slate-100">{data.recentSessions.map(s=><div key={s.sessionId} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><CheckCircle2 size={17}/></div><div><p className="text-sm font-semibold text-slate-800">{s.sessionType==="DAILY" ? "Daily Session" : "Fast Practice"}</p><p className="text-xs text-slate-400">{s.completedAt ? new Date(s.completedAt).toLocaleDateString() : "In progress"}</p></div></div>
          <div className="flex items-center gap-4 text-sm"><span className="font-medium text-slate-500">{s.accuracy?.toFixed(0) ?? 0}% accuracy</span><span className={s.xpChange != null && s.xpChange >= 0 ? "font-bold text-emerald-600" : "font-bold text-rose-500"}>{s.xpChange != null ? `${s.xpChange >= 0 ? "+" : ""}${s.xpChange} XP` : "—"}</span></div>
        </div>)}</div>}
    </section>
  </div>;
}

function DashboardSkeleton() {
  return <div className="animate-pulse space-y-6"><div className="h-20 rounded-2xl bg-slate-200"/><div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[1,2,3,4].map(i=><div key={i} className="h-36 rounded-2xl bg-slate-200"/>)}</div><div className="h-72 rounded-2xl bg-slate-200"/></div>;
}
