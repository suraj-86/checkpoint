import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, LogOut, Moon, Palette, Search, Sun, Sunrise, type LucideIcon } from "lucide-react";
import { useAuth } from "../features/auth/context/AuthContext";
import { THEMES, useTheme, type Theme } from "../lib/theme";
import type { NavEntry } from "./navItems";

interface Action {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  run: () => void;
}

const THEME_ICON: Record<Theme, LucideIcon> = { morning: Sun, dawn: Sunrise, night: Moon };

/** Ctrl K jump menu: pages, themes and log out. Opens from the top bar too. */
export function CommandPalette({ open, onClose, nav }: { open: boolean; onClose: () => void; nav: NavEntry[] }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions = useMemo<Action[]>(
    () => [
      ...nav.map((n) => ({ id: `go-${n.to}`, label: n.label, hint: "Go to", icon: n.icon, run: () => navigate(n.to) })),
      ...THEMES.map((t) => ({
        id: `theme-${t.id}`,
        label: `Theme: ${t.label}`,
        hint: "Appearance",
        icon: THEME_ICON[t.id] ?? Palette,
        run: () => setTheme(t.id),
      })),
      { id: "logout", label: "Log out", hint: "Account", icon: LogOut, run: logout },
    ],
    [nav, navigate, setTheme, logout]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? actions.filter((a) => a.label.toLowerCase().includes(q)) : actions;
  }, [actions, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  if (!open) return null;

  function choose(action: Action | undefined) {
    if (!action) return;
    onClose();
    action.run();
  }

  function onKeyDown(e: ReactKeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => (results.length ? (s + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => (results.length ? (s - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[selected]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh]" role="dialog" aria-modal="true" aria-label="Jump to">
      <div className="dialog-backdrop absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="dialog-panel card relative w-full max-w-lg overflow-hidden" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 border-b-2 border-slate-300 px-4 py-3">
          <Search size={18} className="text-slate-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a page or change theme..."
            className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
            aria-label="Search pages and actions"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
          />
          <span className="kbd text-slate-500">Esc</span>
        </div>
        <ul id="palette-list" role="listbox" className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-500">Nothing matches that.</li>}
          {results.map((a, i) => (
            <li
              key={a.id}
              role="option"
              aria-selected={i === selected}
              onMouseEnter={() => setSelected(i)}
              onClick={() => choose(a)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold ${
                i === selected ? "bg-slate-200 text-slate-800" : "text-slate-600"
              }`}
            >
              <a.icon size={17} />
              <span>{a.label}</span>
              <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-400">
                {a.hint}
                {i === selected && <CornerDownLeft size={12} />}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
