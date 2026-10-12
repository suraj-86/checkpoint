export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function SplitDonut({
  segments,
  size = 120,
  stroke = 14,
  centerLabel,
}: {
  segments: DonutSegment[];
  size?: number;
  stroke?: number;
  centerLabel?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e0e7ff" strokeWidth={stroke} />
          {total > 0 &&
            segments.map((s) => {
              const length = (s.value / total) * circumference;
              const circle = (
                <circle
                  key={s.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                >
                  <title>{`${s.label}: ${s.value}`}</title>
                </circle>
              );
              offset += length;
              return circle;
            })}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-slate-800">
          {centerLabel ?? total}
        </span>
      </div>
      <ul className="space-y-1.5 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
            <span className="font-semibold text-slate-800">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
