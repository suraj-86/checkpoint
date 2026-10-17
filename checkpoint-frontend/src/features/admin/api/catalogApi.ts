import { apiClient } from "@/api/client";
import type { Catalog, NamedItemPayload, SubjectPayload, TopicPayload } from "../types/catalog.types";

const base = "/api/admin/catalog";

export async function getCatalog(): Promise<Catalog> {
  const { data } = await apiClient.get<Catalog>(base);
  return data;
}

export async function createStream(payload: NamedItemPayload): Promise<Catalog> {
  const { data } = await apiClient.post<Catalog>(`${base}/streams`, payload);
  return data;
}

export async function updateStream(id: string, payload: NamedItemPayload): Promise<Catalog> {
  const { data } = await apiClient.put<Catalog>(`${base}/streams/${id}`, payload);
  return data;
}

export async function deleteStream(id: string): Promise<Catalog> {
  const { data } = await apiClient.delete<Catalog>(`${base}/streams/${id}`);
  return data;
}

export async function createExam(payload: NamedItemPayload): Promise<Catalog> {
  const { data } = await apiClient.post<Catalog>(`${base}/exams`, payload);
  return data;
}

export async function updateExam(id: string, payload: NamedItemPayload): Promise<Catalog> {
  const { data } = await apiClient.put<Catalog>(`${base}/exams/${id}`, payload);
  return data;
}

export async function deleteExam(id: string): Promise<Catalog> {
  const { data } = await apiClient.delete<Catalog>(`${base}/exams/${id}`);
  return data;
}

export async function createSubject(payload: SubjectPayload): Promise<Catalog> {
  const { data } = await apiClient.post<Catalog>(`${base}/subjects`, payload);
  return data;
}

export async function updateSubject(id: string, payload: SubjectPayload): Promise<Catalog> {
  const { data } = await apiClient.put<Catalog>(`${base}/subjects/${id}`, payload);
  return data;
}

export async function deleteSubject(id: string): Promise<Catalog> {
  const { data } = await apiClient.delete<Catalog>(`${base}/subjects/${id}`);
  return data;
}

export async function setStreamSubjects(id: string, ids: string[]): Promise<Catalog> {
  const { data } = await apiClient.put<Catalog>(`${base}/streams/${id}/subjects`, { ids });
  return data;
}

export async function setExamSubjects(id: string, ids: string[]): Promise<Catalog> {
  const { data } = await apiClient.put<Catalog>(`${base}/exams/${id}/subjects`, { ids });
  return data;
}

export async function createTopicInSubject(payload: TopicPayload & { subjectId: string }): Promise<Catalog> {
  const { data } = await apiClient.post<Catalog>(`${base}/topics`, payload);
  return data;
}

export async function createTopic(subjectId: string, payload: TopicPayload): Promise<Catalog> {
  const { data } = await apiClient.post<Catalog>(`${base}/subjects/${subjectId}/topics`, payload);
  return data;
}

export async function updateTopic(id: string, payload: TopicPayload): Promise<Catalog> {
  const { data } = await apiClient.put<Catalog>(`${base}/topics/${id}`, payload);
  return data;
}

export async function deleteTopic(id: string): Promise<Catalog> {
  const { data } = await apiClient.delete<Catalog>(`${base}/topics/${id}`);
  return data;
}
