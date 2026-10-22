import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../features/auth/context/AuthContext";
import { useToast } from "../components/ui/Toast";
import { getSettings, saveSettings, type UserSettings } from "./settingsApi";

export type Theme = "morning" | "dawn" | "night";
export const THEMES: { id: Theme; label: string }[] = [
  { id: "morning", label: "Morning" },
  { id: "dawn", label: "Dawn" },
  { id: "night", label: "Night" },
];

const THEME_KEY = "checkpoint_theme";
const SOUND_KEY = "checkpoint_sound";

function isTheme(v: unknown): v is Theme {
  return v === "morning" || v === "dawn" || v === "night";
}

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (isTheme(stored)) return stored;
  } catch {
  }
  return "morning";
}

function readSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) === "1";
  } catch {
    return false;
  }
}

function remember(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
  }
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  soundEnabled: boolean;
  setSoundEnabled: (on: boolean) => void;
  dailyFocusMinutes: number;
  setDailyFocusMinutes: (minutes: number) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [theme, setThemeState] = useState<Theme>(readTheme);
  const [soundEnabled, setSoundState] = useState<boolean>(readSound);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const { data: saved } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    enabled: isAuthenticated,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!saved) return;
    if (saved.theme) {
      const next = saved.theme.toLowerCase();
      if (isTheme(next)) {
        setThemeState(next);
        remember(THEME_KEY, next);
      }
    }
    setSoundState(saved.soundEnabled);
    remember(SOUND_KEY, saved.soundEnabled ? "1" : "0");
  }, [saved]);

  const persist = useCallback(
    (patch: { theme?: string; soundEnabled?: boolean; dailySessionSize?: number; dailyFocusMinutes?: number }) => {
      if (!isAuthenticated) return;
      saveSettings(patch).catch(() => toast("Could not save that to your account. It stays on this device.", "bad"));
    },
    [isAuthenticated, toast]
  );

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      remember(THEME_KEY, next);
      persist({ theme: next.toUpperCase() });
    },
    [persist]
  );

  const setSoundEnabled = useCallback(
    (on: boolean) => {
      setSoundState(on);
      remember(SOUND_KEY, on ? "1" : "0");
      persist({ soundEnabled: on });
    },
    [persist]
  );

  const dailyFocusMinutes = saved?.dailyFocusMinutes ?? 120;

  const setDailyFocusMinutes = useCallback(
    (minutes: number) => {
      queryClient.setQueryData<UserSettings>(["settings"], (old) => (old ? { ...old, dailyFocusMinutes: minutes } : old));
      persist({ dailyFocusMinutes: minutes });
    },
    [persist, queryClient]
  );

  const value = useMemo(
    () => ({ theme, setTheme, soundEnabled, setSoundEnabled, dailyFocusMinutes, setDailyFocusMinutes }),
    [theme, setTheme, soundEnabled, setSoundEnabled, dailyFocusMinutes, setDailyFocusMinutes]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
