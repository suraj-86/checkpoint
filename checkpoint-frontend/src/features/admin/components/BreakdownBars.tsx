interface BreakdownBarsProps {
  title: string;
  items: { label: string; value: number }[];
}

export function BreakdownBars({ title, items }: BreakdownBarsProps) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No data yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.label}>
              <div className="mb-0.5 flex justify-between text-xs text-slate-600">
                <span>{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-slate-700"
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
