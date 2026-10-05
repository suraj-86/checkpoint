import { apiClient } from "@/api/client";
import type {
  ActiveSession,
  AnswerResult,
  AnswerSubmitRequest,
  FastPracticeStartRequest,
  SessionCompletion,
} from "../types/practice.types";

export async function startDaily(): Promise<ActiveSession> {
  const { data } = await apiClient.post<ActiveSession>("/api/practice/daily/start");
  return data;
}

export async function startFast(payload: FastPracticeStartRequest): Promise<ActiveSession> {
  const { data } = await apiClient.post<ActiveSession>("/api/practice/fast/start", payload);
  return data;
}

export async function getActiveSession(): Promise<ActiveSession> {
  const { data } = await apiClient.get<ActiveSession>("/api/practice/active");
  return data;
}

export async function submitAnswer(
  sessionId: string,
  payload: AnswerSubmitRequest
): Promise<AnswerResult> {
  const { data } = await apiClient.post<AnswerResult>(`/api/practice/${sessionId}/answer`, payload);
  return data;
}

export async function completeSession(sessionId: string): Promise<SessionCompletion> {
  const { data } = await apiClient.post<SessionCompletion>(`/api/practice/${sessionId}/complete`);
  return data;
}
