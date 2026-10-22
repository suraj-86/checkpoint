import { apiClient } from "@/api/client";

export interface UserSettings {
  theme: "MORNING" | "DAWN" | "NIGHT" | null;
  soundEnabled: boolean;
  dailySessionSize: number;
  dailyFocusMinutes: number;
}

export async function getSettings(): Promise<UserSettings> {
  const { data } = await apiClient.get<UserSettings>("/api/settings");
  return data;
}

export async function saveSettings(patch: { theme?: string; soundEnabled?: boolean; dailySessionSize?: number; dailyFocusMinutes?: number }): Promise<UserSettings> {
  const { data } = await apiClient.put<UserSettings>("/api/settings", patch);
  return data;
}
