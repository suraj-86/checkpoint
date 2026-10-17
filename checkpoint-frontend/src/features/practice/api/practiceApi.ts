import { apiClient } from "@/api/client";
import type {
  ActiveSession,
  AnswerResult,
  AnswerSubmitRequest,
  FastPracticeStartRequest,
  SessionCompletion,
  SlotQuestion,
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

export interface SessionAbandon {
  sessionId: string;
  status: string;
  answeredCount: number;
  correctCount: number;
  primaryQuestionCount: number;
  skippedForLater: number;
}

export async function abandonSession(sessionId: string): Promise<SessionAbandon> {
  const { data } = await apiClient.post<SessionAbandon>(`/api/practice/${sessionId}/abandon`);
  return data;
}

export async function getOverview(sessionId: string): Promise<ActiveSession> {
  const { data } = await apiClient.get<ActiveSession>(`/api/practice/${sessionId}/overview`);
  return data;
}

export async function getSlot(sessionId: string, position: number): Promise<SlotQuestion> {
  const { data } = await apiClient.get<SlotQuestion>(`/api/practice/${sessionId}/slots/${position}`);
  return data;
}

export async function skipSlot(sessionId: string, position: number): Promise<ActiveSession> {
  const { data } = await apiClient.post<ActiveSession>(`/api/practice/${sessionId}/slots/${position}/skip`);
  return data;
}
