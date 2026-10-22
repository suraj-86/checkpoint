import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastTone = "good" | "bad" | "info";
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const TONE_BORDER: Record<ToastTone, string> = {
  good: "border-emerald-500",
  bad: "border-rose-500",
  info: "border-indigo-400",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const show = useCallback((message: string, tone: ToastTone = "info") => {
    const id = nextId.current++;
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[60] flex flex-col gap-2 md:bottom-6" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={`page-enter pointer-events-auto rounded-2xl border-2 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-[0_4px_0_rgb(var(--cs))] ${TONE_BORDER[t.tone]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
