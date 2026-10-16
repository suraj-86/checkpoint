import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { USERNAME_RULES } from "../../../lib/username";
import type { UsernameState } from "../hooks/useUsernameStatus";

export function UsernameHints({ state }: { state: UsernameState }) {
  return (
    <div className="mt-1.5 space-y-1.5 text-xs">
      {state.kind === "checking" && (
        <p className="flex items-center gap-1 text-slate-500">
          <Loader2 size={13} className="animate-spin" /> Checking availability...
        </p>
      )}
      {state.kind === "available" && (
        <p className="flex items-center gap-1 text-emerald-600">
          <CheckCircle2 size={13} /> {state.message}
        </p>
      )}
      {(state.kind === "taken" || state.kind === "invalid") && (
        <p className="flex items-center gap-1 text-red-600">
          <XCircle size={13} /> {state.message}
        </p>
      )}
      {state.kind === "limited" && (
        <p className="text-amber-600">Too many checks right now. Wait a minute; we will also check when you save.</p>
      )}
      {state.kind === "error" && (
        <p className="text-amber-600">Could not check availability. We will check again when you save.</p>
      )}
      <ul className="list-disc space-y-0.5 pl-4 text-slate-400">
        {USERNAME_RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </div>
  );
}
