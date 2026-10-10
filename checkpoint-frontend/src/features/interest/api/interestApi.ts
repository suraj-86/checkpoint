import { apiClient } from "@/api/client";

export interface Interests {
  topicIds: string[];
}

export async function getInterests(): Promise<Interests> {
  const { data } = await apiClient.get<Interests>("/api/profile/interests");
  return data;
}

export async function saveInterests(topicIds: string[]): Promise<Interests> {
  const { data } = await apiClient.put<Interests>("/api/profile/interests", { topicIds });
  return data;
}
