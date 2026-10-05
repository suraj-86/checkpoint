import { apiClient } from "@/api/client";
import type {
  ActivityDayPoint,
  Dashboard,
  PageResponse,
  Profile,
  ProgressOverall,
  SessionSummary,
  Topic,
  TopicPerformance,
} from "../types/progress.types";

export async function getProfile(): Promise<Profile> {
  const { data } = await apiClient.get<Profile>("/api/profile");
  return data;
}

export async function getDashboard(): Promise<Dashboard> {
  const { data } = await apiClient.get<Dashboard>("/api/profile/dashboard");
  return data;
}

export async function getOverallProgress(): Promise<ProgressOverall> {
  const { data } = await apiClient.get<ProgressOverall>("/api/progress");
  return data;
}

export async function getTopicPerformance(): Promise<TopicPerformance[]> {
  const { data } = await apiClient.get<TopicPerformance[]>("/api/progress/topics");
  return data;
}

export async function getActivity(days = 30): Promise<ActivityDayPoint[]> {
  const { data } = await apiClient.get<ActivityDayPoint[]>("/api/progress/activity", {
    params: { days },
  });
  return data;
}

export async function getSessionHistory(page = 0, size = 10): Promise<PageResponse<SessionSummary>> {
  const { data } = await apiClient.get<PageResponse<SessionSummary>>("/api/progress/sessions", {
    params: { page, size },
  });
  return data;
}

export async function getTopics(): Promise<Topic[]> {
  const { data } = await apiClient.get<Topic[]>("/api/topics");
  return data;
}
