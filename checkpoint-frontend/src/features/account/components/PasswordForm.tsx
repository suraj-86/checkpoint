import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { messageFromError } from "../../admin/utils/format";
import { inputClass, labelClass, primaryButton } from "../../../components/ui/styles";
import { changePassword } from "../api/accountApi";

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () => changePassword(current, next),
    onSuccess: () => {
      setCurrent("");
      setNext("");
      setConfirm("");
      setMessage({ ok: true, text: "Password changed. Use the new one the next time you log in." });
    },
    onError: (err) => setMessage({ ok: false, text: messageFromError(err) }),
  });

  function submit() {
    if (next.length < 8) {
      setMessage({ ok: false, text: "The new password must be at least 8 characters." });
      return;
    }
    if (next !== confirm) {
      setMessage({ ok: false, text: "The new password and its confirmation do not match." });
      return;
    }
    setMessage(null);
    mutation.mutate();
  }

  const type = show ? "text" : "password";

  return (
    <div className="card p-6">
      <h2 className="text-base font-semibold text-slate-800">Change password</h2>
      <p className="mt-1 text-sm text-slate-500">Choose a password you do not use anywhere else.</p>

      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div>
          <label className={labelClass} htmlFor="currentPassword">Current password</label>
          <input
            id="currentPassword"
            type={type}
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              type={type}
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="confirmPassword">Confirm new password</label>
            <input
              id="confirmPassword"
              type={type}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-500">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
          Show passwords
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!current || !next || !confirm || mutation.isPending}
            className={primaryButton}
          >
            {mutation.isPending ? "Updating..." : "Update password"}
          </button>
          {message && (
            <span className={`text-sm ${message.ok ? "text-emerald-600" : "text-red-600"}`}>{message.text}</span>
          )}
        </div>
      </form>
    </div>
  );
}
