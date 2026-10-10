import { useQuery } from "@tanstack/react-query";
import { Award, Calendar, Flame, User, Zap } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { Avatar } from "../../../components/ui/Avatar";
import { formatDay, plural } from "../../../lib/format";
import { getAccount } from "../../account/api/accountApi";
import { PasswordForm } from "../../account/components/PasswordForm";
import { ProfileForm } from "../../account/components/ProfileForm";
import { InterestPicker } from "../../interest/components/InterestPicker";
import { getProfile } from "../api/progressApi";

function Row({ icon: Icon, label, value }: { icon: ElementType; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5 text-sm text-slate-500">
        <Icon size={16} className="text-indigo-500" />
        {label}
      </div>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}

export function ProfilePage() {
  const { data: profile, isError: profileError } = useQuery({ queryKey: ["profile"], queryFn: getProfile });
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

        <div className="card divide-y divide-slate-100 px-5 py-2">
          <Row icon={Award} label="Level" value={profile.level} />
          <Row icon={Zap} label="Total XP" value={profile.totalXp} />
          <Row icon={Flame} label="Current streak" value={plural(profile.currentStreak, "day")} />
          <Row icon={Flame} label="Longest streak" value={plural(profile.longestStreak, "day")} />
          <Row icon={Calendar} label="Daily Sessions completed" value={profile.totalDailySessions} />
          <Row icon={User} label="Fast Practice sessions" value={profile.totalFastSessions} />
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
