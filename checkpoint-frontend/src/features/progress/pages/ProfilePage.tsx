import type { ElementType, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Award, Flame, Calendar, Zap } from "lucide-react";
import { getProfile } from "../api/progressApi";

function Row({ icon: Icon, label, value }: { icon: ElementType; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={16} />
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

export function ProfilePage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["profile"], queryFn: getProfile });

  if (isLoading) return <p className="text-slate-500">Loading profile...</p>;
  if (isError || !data) return <p className="text-red-600">Could not load your profile.</p>;

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-lg font-semibold text-white">
          {data.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-800">{data.username}</h1>
          <p className="text-sm text-slate-500">{data.role}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white px-4">
        <Row icon={Award} label="Level" value={data.level} />
        <Row icon={Zap} label="Total XP" value={data.totalXp} />
        <Row icon={Flame} label="Current streak" value={`${data.currentStreak} ${data.currentStreak === 1 ? "day" : "days"}`} />
        <Row icon={Flame} label="Longest streak" value={`${data.longestStreak} ${data.longestStreak === 1 ? "day" : "days"}`} />
        <Row icon={Calendar} label="Daily Sessions completed" value={data.totalDailySessions} />
        <Row icon={User} label="Fast Practice sessions" value={data.totalFastSessions} />
      </div>
    </div>
  );
}
