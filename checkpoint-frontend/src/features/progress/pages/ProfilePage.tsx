import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy } from "lucide-react";
import { Avatar } from "../../../components/ui/Avatar";
import { formatDay } from "../../../lib/format";
import { getAccount } from "../../account/api/accountApi";
import { PasswordForm } from "../../account/components/PasswordForm";
import { ProfileForm } from "../../account/components/ProfileForm";
import { InterestPicker } from "../../interest/components/InterestPicker";
import { LevelProgressCard } from "../../../components/ui/LevelProgressCard";
import { SplitDonut } from "../../../components/ui/SplitDonut";
import { getActivity, getProfile } from "../api/progressApi";
import { WeekStrip } from "../components/WeekStrip";

export function ProfilePage() {
  const { data: profile, isError: profileError } = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const { data: activity } = useQuery({ queryKey: ["progress-activity", 30], queryFn: () => getActivity(30) });
  const { data: account, isError: accountError } = useQuery({ queryKey: ["account"], queryFn: getAccount });

  if (profileError || accountError) return <p className="text-red-600">Could not load your profile.</p>;
  if (!profile || !account) return <p className="text-slate-500">Loading...</p>;

  const name = account.displayName || account.username;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6">
        <div className="card p-6 text-center">
          <div className="flex justify-center">
            <Avatar name={name} color={account.avatarColor} size={88} />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-800">{name}</h1>
          <p className="text-sm text-slate-500">@{account.username}</p>
          <span className="mt-3 inline-block rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700">
            {profile.role}
          </span>
          {account.goal && <p className="mt-4 text-sm font-medium text-slate-700">{account.goal}</p>}
          {account.bio && <p className="mt-2 text-sm text-slate-500">{account.bio}</p>}
          <p className="mt-4 text-xs text-slate-400">Member since {formatDay(account.createdAt)}</p>
        </div>

        <LevelProgressCard totalXp={profile.totalXp} progress={profile.levelProgress} />

        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <Flame size={18} className="text-amber-500" />
            <p className="mt-2 text-2xl font-semibold text-slate-800">{profile.currentStreak}</p>
            <p className="text-xs text-slate-500">Current streak (days)</p>
          </div>
          <div className="card p-4">
            <Trophy size={18} className="text-violet-500" />
            <p className="mt-2 text-2xl font-semibold text-slate-800">{profile.longestStreak}</p>
            <p className="text-xs text-slate-500">Longest streak (days)</p>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Sessions completed</h2>
          <SplitDonut
            size={104}
            stroke={13}
            segments={[
              { label: "Daily", value: profile.totalDailySessions, color: "#6366f1" },
              { label: "Fast Practice", value: profile.totalFastSessions, color: "#f59e0b" },
            ]}
          />
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Last 7 days</h2>
          {activity ? <WeekStrip data={activity} /> : <p className="text-sm text-slate-400">Loading...</p>}
        </div>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <ProfileForm account={account} />
        <InterestPicker />
        <PasswordForm />
      </div>
    </div>
  );
}
