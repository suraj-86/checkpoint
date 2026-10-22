import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Inbox } from "lucide-react";
import { listAdminRequests } from "../../help/api/helpApi";
import { getAdminDashboard } from "../api/adminApi";
import { BreakdownBars } from "../components/BreakdownBars";
import { formatDateTime, prettify } from "../utils/format";

export function AdminDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
  });

  const { data: openRequests } = useQuery({
    queryKey: ["admin-support", "OPEN", 0],
    queryFn: () => listAdminRequests("OPEN", 0),
  });
  const openCount = openRequests?.totalElements ?? 0;

  if (isLoading) return <p className="text-sm text-slate-400">Loading...</p>;
  if (isError || !data) {
    return <p className="text-sm text-red-600">Could not load the admin dashboard.</p>;
  }

  const stats = [
    { label: "Active questions", value: data.activeQuestions, color: "text-emerald-600", to: "/admin/questions?active=true" },
    { label: "Retired questions", value: data.retiredQuestions, color: "text-amber-600", to: "/admin/questions?active=false" },
    { label: "Streams", value: data.streamCount, color: "text-slate-800", to: "/admin/streams" },
    { label: "Exams", value: data.examCount, color: "text-slate-800", to: "/admin/exams" },
    { label: "Subjects", value: data.subjectCount, color: "text-slate-800", to: "/admin/subjects" },
    { label: "Topics", value: data.topicCount, color: "text-slate-800", to: "/admin/topics" },
    { label: "Datasets", value: data.datasetCount, color: "text-slate-800", to: "/admin/datasets" },
    { label: "Students", value: data.studentCount, color: "text-slate-800" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">The question bank at a glance</p>
          <h1 className="font-display text-[clamp(28px,4vw,40px)] font-extrabold leading-tight text-slate-800">
            Admin dashboard
          </h1>
        </div>
        <Link to="/admin/datasets/upload" className="btn-primary">
          Upload dataset
        </Link>
      </div>

      {openCount > 0 && (
        <Link
          to="/admin/requests"
          className="card flex items-center gap-3 !border-amber-400 p-4 transition hover:-translate-y-0.5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Inbox size={20} />
          </span>
          <span className="flex-1 text-sm">
            <b className="text-slate-800">
              {openCount} open {openCount === 1 ? "request" : "requests"}
            </b>
            <span className="block text-slate-500">Students are waiting to hear back.</span>
          </span>
          <ArrowRight size={18} className="text-slate-500" />
        </Link>
      )}

      {data.totalQuestions === 0 && (
        <div className="card !border-amber-400 !bg-amber-100 p-4 text-sm font-semibold text-amber-800">
          The question bank is empty. Students cannot practice until you import a dataset.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {stats.map((s) => {
          const body = (
            <>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`font-display text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            </>
          );
          return s.to ? (
            <Link key={s.label} to={s.to} className="card p-4 transition hover:-translate-y-0.5">
              {body}
            </Link>
          ) : (
            <div key={s.label} className="card p-4">
              {body}
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BreakdownBars title="Active by stream" items={data.activeByStream.map((n) => ({ label: n.name, value: n.count }))} />
        <BreakdownBars title="Active by subject" items={data.activeBySubject.map((n) => ({ label: n.name, value: n.count }))} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <BreakdownBars
          title="Active by difficulty"
          items={Object.entries(data.activeByDifficulty).map(([k, v]) => ({ label: prettify(k), value: v }))}
        />
        <BreakdownBars
          title="Active by type"
          items={Object.entries(data.activeByType).map(([k, v]) => ({ label: prettify(k), value: v }))}
        />
        <BreakdownBars
          title="Active by topic"
          items={data.activeByTopic.map((t) => ({ label: t.topic, value: t.count }))}
        />
      </div>

      <div className="card p-4">
        <h2 className="mb-2 text-sm font-bold text-slate-800">Latest dataset</h2>
        {data.latestDataset ? (
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium text-slate-800">
                {data.latestDataset.name} <span className="text-slate-500">v{data.latestDataset.version}</span>
              </p>
              <p className="text-xs text-slate-500">
                First imported {formatDateTime(data.latestDataset.importedAt)} ·{" "}
                {data.latestDataset.activeQuestionCount} of {data.latestDataset.questionCount} questions active
              </p>
            </div>
            <Link to="/admin/datasets" className="text-sm font-bold text-indigo-600 hover:underline">
              All datasets
            </Link>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No datasets imported yet.</p>
        )}
      </div>
    </div>
  );
}
