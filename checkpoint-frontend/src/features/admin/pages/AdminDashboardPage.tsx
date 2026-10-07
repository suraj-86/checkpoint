import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getAdminDashboard } from "../api/adminApi";
import { BreakdownBars } from "../components/BreakdownBars";
import { formatDateTime, prettify } from "../utils/format";

export function AdminDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
  });

  if (isLoading) return <p className="text-sm text-slate-400">Loading...</p>;
  if (isError || !data) {
    return <p className="text-sm text-red-600">Could not load the admin dashboard.</p>;
  }

  const stats = [
    { label: "Active questions", value: data.activeQuestions, color: "text-green-600" },
    { label: "Retired questions", value: data.retiredQuestions, color: "text-amber-600" },
    { label: "Topics", value: data.topicCount, color: "text-slate-800" },
    { label: "Datasets", value: data.datasetCount, color: "text-slate-800" },
    { label: "Students", value: data.studentCount, color: "text-slate-800" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Admin Dashboard</h1>
        <Link
          to="/admin/datasets/upload"
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Upload dataset
        </Link>
      </div>

      {data.totalQuestions === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          The question bank is empty. Students cannot practice until you import a dataset.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
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

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Latest dataset</h2>
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
            <Link to="/admin/datasets" className="text-sm text-slate-600 underline hover:text-slate-800">
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
