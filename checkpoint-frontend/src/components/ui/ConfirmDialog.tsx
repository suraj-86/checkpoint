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
    button: "",
  },
  warning: {
    icon: <AlertTriangle size={22} />,
    ring: "bg-amber-100 text-amber-600",
    button: "!border-amber-700 !bg-amber-700 !text-white hover:!bg-amber-800",
  },
  info: {
    icon: <Info size={22} />,
    ring: "bg-sky-100 text-sky-600",
    button: "",
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
      <div className="dialog-panel card relative w-full max-w-md p-6">
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
              className="btn-secondary"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={onConfirm ?? onCancel}
            disabled={busy}
            className={`btn-primary ${style.button}`}
          >
            {onConfirm ? confirmLabel : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
}
