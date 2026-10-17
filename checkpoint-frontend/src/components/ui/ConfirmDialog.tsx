import { useEffect, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

export type DialogTone = "primary" | "warning" | "info";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  tone?: DialogTone;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel: () => void;
  busy?: boolean;
}

const toneStyles: Record<DialogTone, { icon: ReactNode; ring: string; button: string }> = {
  primary: {
    icon: <CheckCircle2 size={22} />,
    ring: "bg-indigo-100 text-indigo-600",
    button: "from-indigo-600 to-violet-600 shadow-indigo-200 hover:from-indigo-700 hover:to-violet-700",
  },
  warning: {
    icon: <AlertTriangle size={22} />,
    ring: "bg-amber-100 text-amber-600",
    button: "from-amber-500 to-orange-500 shadow-amber-200 hover:from-amber-600 hover:to-orange-600",
  },
  info: {
    icon: <Info size={22} />,
    ring: "bg-sky-100 text-sky-600",
    button: "from-sky-500 to-indigo-500 shadow-sky-200 hover:from-sky-600 hover:to-indigo-600",
  },
};

export function ConfirmDialog({
  open,
  title,
  tone = "primary",
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  const style = toneStyles[tone];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="dialog-backdrop absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="dialog-panel relative w-full max-w-md rounded-2xl border border-white/80 bg-white p-6 shadow-2xl shadow-indigo-200/60">
        <div className="flex items-start gap-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${style.ring}`}>{style.icon}</span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            <div className="mt-2 space-y-2 text-sm text-slate-600">{children}</div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          {onConfirm && (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={onConfirm ?? onCancel}
            disabled={busy}
            className={`rounded-xl bg-gradient-to-r px-4 py-2 text-sm font-semibold text-white shadow-md transition disabled:opacity-50 ${style.button}`}
          >
            {onConfirm ? confirmLabel : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
}
