import { apiClient } from "@/api/client";
import type { PageResponse } from "@/features/progress/types/progress.types";
import type {
  AdminDashboard,
  AdminQuestion,
  DatasetSummary,
  ImportResponse,
  QuestionFilters,
  UploadPayload,
  ValidationResponse,
} from "../types/admin.types";

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const { data } = await apiClient.get<AdminDashboard>("/api/admin/dashboard");
  return data;
}

export async function getDatasets(): Promise<DatasetSummary[]> {
  const { data } = await apiClient.get<DatasetSummary[]>("/api/admin/datasets");
  return data;
}

export async function validateDataset(payload: UploadPayload): Promise<ValidationResponse> {
  const { data } = await apiClient.post<ValidationResponse>("/api/admin/datasets/validate", payload);
  return data;
}

export async function importDataset(payload: UploadPayload): Promise<ImportResponse> {
  const { data } = await apiClient.post<ImportResponse>("/api/admin/datasets/import", payload);
  return data;
}

export async function searchQuestions(
  filters: QuestionFilters,
  page: number,
  size: number
): Promise<PageResponse<AdminQuestion>> {
  const { data } = await apiClient.get<PageResponse<AdminQuestion>>("/api/admin/questions", {
    params: {
      topicId: filters.topicId || undefined,
      difficulty: filters.difficulty || undefined,
      type: filters.type || undefined,
      active: filters.active || undefined,
      page,
      size,
    },
  });
  return data;
}

export async function retireQuestion(id: string): Promise<AdminQuestion> {
  const { data } = await apiClient.patch<AdminQuestion>(`/api/admin/questions/${id}/retire`);
  return data;
}

export async function restoreQuestion(id: string): Promise<AdminQuestion> {
  const { data } = await apiClient.patch<AdminQuestion>(`/api/admin/questions/${id}/restore`);
  return data;
}
