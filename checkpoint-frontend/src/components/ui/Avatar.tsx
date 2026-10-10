const GRADIENTS: Record<string, string> = {
  indigo: "from-indigo-500 to-violet-500",
  sky: "from-sky-400 to-blue-500",
  emerald: "from-emerald-400 to-teal-500",
  amber: "from-amber-400 to-orange-500",
  rose: "from-rose-400 to-pink-500",
  violet: "from-violet-500 to-fuchsia-500",
  slate: "from-slate-500 to-slate-700",
  blue: "from-blue-500 to-cyan-500",
};

export const AVATAR_COLOR_KEYS = Object.keys(GRADIENTS);

export function avatarGradient(color?: string | null): string {
  return GRADIENTS[color ?? ""] ?? GRADIENTS.indigo;
}

export function Avatar({ name, color, size = 40 }: { name: string; color?: string | null; size?: number }) {
  const initial = (name.trim().charAt(0) || "?").toUpperCase();
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-md ${avatarGradient(color)}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initial}
    </div>
  );
}
