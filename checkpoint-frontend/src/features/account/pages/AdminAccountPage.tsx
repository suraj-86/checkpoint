import { useQuery } from "@tanstack/react-query";
import { Avatar } from "../../../components/ui/Avatar";
import { formatDay } from "../../../lib/format";
import { getAccount } from "../api/accountApi";
import { PasswordForm } from "../components/PasswordForm";
import { ProfileForm } from "../components/ProfileForm";

export function AdminAccountPage() {
  const { data: account, isError } = useQuery({ queryKey: ["account"], queryFn: getAccount });

  if (isError) return <p className="text-red-600">Could not load your account.</p>;
  if (!account) return <p className="text-slate-500">Loading...</p>;

  const name = account.displayName || account.username;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card flex items-center gap-4 p-6">
        <Avatar name={name} color={account.avatarColor} size={64} />
        <div>
          <h1 className="text-xl font-semibold text-slate-800">{name}</h1>
          <p className="text-sm text-slate-500">
            @{account.username} &middot; {account.role} &middot; member since {formatDay(account.createdAt)}
          </p>
        </div>
      </div>

      <ProfileForm account={account} />
      <PasswordForm />
    </div>
  );
}
