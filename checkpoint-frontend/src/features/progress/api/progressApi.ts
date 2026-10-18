import { apiClient } from "@/api/client";
import type {
  ActivityDayPoint,
  Dashboard,
  PageResponse,
  HistoryFilters,
  MasteryResponse,
  Profile,
  SessionDetail,
  SessionHistoryItem,
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

export async function getSessionDetail(sessionId: string): Promise<SessionDetail> {
  const { data } = await apiClient.get<SessionDetail>(`/api/progress/sessions/${sessionId}`);
  return data;
}

function startOfLocalDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toISOString();
}

function startOfNextLocalDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d + 1).toISOString();
}

export async function searchHistory(
  filters: HistoryFilters,
  page: number,
  size = 15
): Promise<PageResponse<SessionHistoryItem>> {
  const params: Record<string, string | number> = { page, size, sort: filters.sort };
  if (filters.q.trim()) params.q = filters.q.trim();
  if (filters.type) params.type = filters.type;
  if (filters.status) params.status = filters.status;
  if (filters.subjectId) params.subjectId = filters.subjectId;
  if (filters.topicId) params.topicId = filters.topicId;
  if (filters.result) params.result = filters.result;
  if (filters.fromDate) params.from = startOfLocalDay(filters.fromDate);
  if (filters.toDate) params.to = startOfNextLocalDay(filters.toDate);
  const { data } = await apiClient.get<PageResponse<SessionHistoryItem>>("/api/progress/history", { params });
  return data;
}

export async function getMastery(): Promise<MasteryResponse> {
  const { data } = await apiClient.get<MasteryResponse>("/api/progress/mastery");
  return data;
}
