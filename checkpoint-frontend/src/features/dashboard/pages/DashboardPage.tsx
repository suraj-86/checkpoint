import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { getDashboard, getMastery, getOverallProgress } from "../../progress/api/progressApi";
import { useAuth } from "../../auth/context/AuthContext";
import { startDaily } from "../../practice/api/practiceApi";
import { getInterests } from "../../interest/api/interestApi";
import { getPreferences } from "../../preference/api/preferenceApi";
import {
  AccuracyTrendCard,
  HeroCard,
  MasterySummaryCard,
  QuestsCard,
  RecentSessionsCard,
  StatsStrip,
  TipCard,
  WiltingCard,
  pickFocus,
} from "../components/HomeWidgets";
import { useStudentCatalog } from "../../catalog/hooks/useStudentCatalog";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const { data: interests } = useQuery({
    queryKey: ["interests"],
    queryFn: getInterests,
  });

  const { data: preferences } = useQuery({
    queryKey: ["preferences"],
    queryFn: getPreferences,
  });

  const { data: overall } = useQuery({
    queryKey: ["progress-overall"],
    queryFn: getOverallProgress,
  });

  const { data: catalog } = useStudentCatalog();

  const { data: mastery } = useQuery({ queryKey: ["progress-mastery"], queryFn: getMastery });

  const startDailyMutation = useMutation({
    mutationFn: startDaily,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate(`/practice/session/${session.sessionId}`);
    },
  });

  if (isLoading) {
    return <p className="text-slate-500">Loading...</p>;
  }

  if (isError || !data) {
    return <p className="text-red-600">Could not load your home page. Try refreshing.</p>;
  }

  const focus = pickFocus(mastery, interests, preferences, catalog);
  const name = user?.username ?? data.username;

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">Welcome back, {name}</p>
        <h1 className="font-display text-[clamp(28px,4vw,40px)] font-extrabold leading-tight text-slate-800">Your garden today</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-12 [&>*]:h-full">
        <div className="lg:col-span-8 [&>*]:h-full">
          <HeroCard
            data={data}
            focus={focus}
            starting={startDailyMutation.isPending}
            startFailed={startDailyMutation.isError}
            onStartDaily={() => startDailyMutation.mutate()}
          />
        </div>
        <div className="lg:col-span-4 [&>*]:h-full">
          <StatsStrip data={data} overall={overall} />
        </div>
      </div>

      {interests && preferences && interests.topicIds.length === 0 && preferences.subjectIds.length === 0 && !preferences.streamId && !preferences.examId && (
        <div className="card p-4 text-sm font-semibold text-slate-700">
          Your Daily Sessions currently include every topic.{" "}
          <Link to="/profile" className="font-bold text-indigo-600 underline">
            Choose your stream, subjects or topics
          </Link>{" "}
          to focus your practice.
        </div>
      )}

      <h2 className="mt-2 font-display text-xl font-bold text-slate-800">Keep it growing</h2>
      <div className="grid gap-4 lg:grid-cols-3 [&>*]:h-full">
        <WiltingCard focus={focus} />
        <QuestsCard data={data} />
        <AccuracyTrendCard sessions={data.recentSessions} />
      </div>

      <h2 className="mt-2 font-display text-xl font-bold text-slate-800">Your progress</h2>
      <div className="grid gap-4 lg:grid-cols-12 [&>*]:h-full">
        <div className="lg:col-span-7 [&>*]:h-full">
          <RecentSessionsCard sessions={data.recentSessions} />
        </div>
        <div className="lg:col-span-5 [&>*]:h-full">
          <MasterySummaryCard overall={overall} mastery={mastery} />
        </div>
      </div>

      <TipCard />
    </div>
  );
}
