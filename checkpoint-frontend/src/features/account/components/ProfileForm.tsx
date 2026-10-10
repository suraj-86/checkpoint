import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messageFromError } from "../../admin/utils/format";
import { AVATAR_COLOR_KEYS, Avatar, avatarGradient } from "../../../components/ui/Avatar";
import { inputClass, labelClass, primaryButton } from "../../../components/ui/styles";
import { updateProfile, type Account } from "../api/accountApi";

export function ProfileForm({ account }: { account: Account }) {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(account.displayName ?? "");
  const [email, setEmail] = useState(account.email);
  const [bio, setBio] = useState(account.bio ?? "");
  const [goal, setGoal] = useState(account.goal ?? "");
  const [color, setColor] = useState(account.avatarColor ?? "indigo");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () => updateProfile({ displayName, email, bio, goal, avatarColor: color }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["account"], updated);
      setMessage({ ok: true, text: "Profile saved." });
    },
    onError: (err) => setMessage({ ok: false, text: messageFromError(err) }),
  });

  const dirty =
    displayName !== (account.displayName ?? "") ||
    email !== account.email ||
    bio !== (account.bio ?? "") ||
    goal !== (account.goal ?? "") ||
    color !== (account.avatarColor ?? "indigo");

  function touch<T>(setter: (value: T) => void) {
    return (value: T) => {
      setMessage(null);
      setter(value);
    };
  }

  return (
    <div className="card p-6">
      <h2 className="text-base font-semibold text-slate-800">Edit profile</h2>
      <p className="mt-1 text-sm text-slate-500">This is how you appear inside Checkpoint.</p>

      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              value={displayName}
              maxLength={60}
              placeholder={account.username}
              onChange={(e) => touch(setDisplayName)(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="username">Username</label>
            <input id="username" value={account.username} disabled className={`${inputClass} cursor-not-allowed opacity-60`} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => touch(setEmail)(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="goal">What are you practicing for?</label>
          <input
            id="goal"
            value={goal}
            maxLength={100}
            placeholder="For example: campus placements, a backend interview, learning SQL"
            onChange={(e) => touch(setGoal)(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className={labelClass} htmlFor="bio">About me</label>
            <span className="text-xs text-slate-400">{bio.length}/300</span>
          </div>
          <textarea
            id="bio"
            rows={3}
            value={bio}
            maxLength={300}
            placeholder="A short note about yourself"
            onChange={(e) => touch(setBio)(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <span className={labelClass}>Avatar colour</span>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Avatar name={displayName || account.username} color={color} size={44} />
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLOR_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={`Use ${key} avatar`}
                  aria-pressed={color === key}
                  onClick={() => touch(setColor)(key)}
                  className={`h-7 w-7 rounded-full bg-gradient-to-br ${avatarGradient(key)} ring-offset-2 transition ${
                    color === key ? "ring-2 ring-indigo-500" : "hover:scale-110"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={!dirty || mutation.isPending} className={primaryButton}>
            {mutation.isPending ? "Saving..." : "Save changes"}
          </button>
          {message && (
            <span className={`text-sm ${message.ok ? "text-emerald-600" : "text-red-600"}`}>{message.text}</span>
          )}
        </div>
      </form>
    </div>
  );
}
