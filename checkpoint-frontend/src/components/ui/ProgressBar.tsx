export function ProgressBar({
  value,
  tone = "pri",
  label,
}: {
  value: number;
  tone?: "pri" | "good";
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className="h-3 overflow-hidden rounded-full border-2 border-slate-300 bg-slate-100"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${pct}%`,
          background: tone === "good" ? "#2f9e76" : "linear-gradient(90deg, #a98bf5, rgb(var(--pri)))",
        }}
      />
    </div>
  );
}
