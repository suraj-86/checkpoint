import { apiClient } from "@/api/client";

export interface SubtopicRow {
  key: string;
  label: string;
  count: number;
}

export interface OrganisePreview {
  subjectId: string;
  subjectName: string;
  generalTopicId: string | null;
  generalQuestions: number;
  withoutSubtopic: number;
  subtopics: SubtopicRow[];
  existingTopics: string[];
}

export interface OrganiseMove {
  subtopic: string;
  topicName: string;
}

export interface OrganiseResult {
  moved: number;
  topicsCreated: string[];
}

export async function getSubtopics(subjectId: string): Promise<OrganisePreview> {
  const { data } = await apiClient.get<OrganisePreview>(`/api/admin/catalog/subjects/${subjectId}/subtopics`);
  return data;
}

export async function organiseSubject(subjectId: string, moves: OrganiseMove[]): Promise<OrganiseResult> {
  const { data } = await apiClient.post<OrganiseResult>(`/api/admin/catalog/subjects/${subjectId}/organise`, { moves });
  return data;
}
