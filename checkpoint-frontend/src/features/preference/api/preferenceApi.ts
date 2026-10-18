import { apiClient } from "@/api/client";

export interface Preferences {
  streamId: string | null;
  examId: string | null;
  subjectIds: string[];
}

export async function getPreferences(): Promise<Preferences> {
  const { data } = await apiClient.get<Preferences>("/api/profile/preferences");
  return data;
}

export async function savePreferences(preferences: Preferences): Promise<Preferences> {
  const { data } = await apiClient.put<Preferences>("/api/profile/preferences", preferences);
  return data;
}
