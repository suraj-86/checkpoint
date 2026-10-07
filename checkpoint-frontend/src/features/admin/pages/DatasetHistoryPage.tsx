import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getDatasets } from "../api/adminApi";
import { formatDateTime } from "../utils/format";

export function DatasetHistoryPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["admin-datasets"], queryFn: getDatasets });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Datasets</h1>
        <Link
          to="/admin/datasets/upload"
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Upload dataset
        </Link>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Loading...</p>}
      {isError && <p className="text-sm text-red-600">Could not load datasets.</p>}

      {data && data.length === 0 && (
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No datasets yet. Upload your first one to fill the question bank.
        </p>
      )}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Version</th>
                <th className="px-4 py-2">First imported</th>
                <th className="px-4 py-2 text-right">Questions</th>
                <th className="px-4 py-2 text-right">Active</th>
                <th className="px-4 py-2 text-right">Retired</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 font-medium text-slate-800">{d.name}</td>
                  <td className="px-4 py-2 text-slate-600">{d.version}</td>
                  <td className="px-4 py-2 text-slate-600">{formatDateTime(d.importedAt)}</td>
                  <td className="px-4 py-2 text-right text-slate-800">{d.questionCount}</td>
                  <td className="px-4 py-2 text-right text-green-600">{d.activeQuestionCount}</td>
                  <td className="px-4 py-2 text-right text-amber-600">{d.questionCount - d.activeQuestionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
