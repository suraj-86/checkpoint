import { Moon, Sun, Sunrise, type LucideIcon } from "lucide-react";
import { THEMES, useTheme, type Theme } from "../lib/theme";

const ICON: Record<Theme, LucideIcon> = { morning: Sun, dawn: Sunrise, night: Moon };

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex gap-1.5" role="group" aria-label="Theme">
      {THEMES.map(({ id, label }) => {
        const Icon = ICON[id];
        const active = theme === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            aria-pressed={active}
            title={label}
            className={`flex flex-1 items-center justify-center rounded-xl border-2 py-1.5 transition ${
              active
                ? "border-indigo-500 bg-indigo-500 text-white shadow-[0_3px_0_rgb(var(--cb))]"
                : "border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            <Icon size={15} />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
