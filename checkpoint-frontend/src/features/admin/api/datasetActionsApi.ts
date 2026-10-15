import { apiClient } from "@/api/client";

export interface DatasetImpact {
  datasetId: string;
  name: string;
  questions: number;
  activeQuestions: number;
  attempts: number;
  sessionEntries: number;
  progressRows: number;
}

export interface DatasetActionResult {
  message: string;
  affectedQuestions: number;
}

export async function getDatasetImpact(id: string): Promise<DatasetImpact> {
  const { data } = await apiClient.get<DatasetImpact>(`/api/admin/datasets/${id}/impact`);
  return data;
}

export async function retireDataset(id: string): Promise<DatasetActionResult> {
  const { data } = await apiClient.patch<DatasetActionResult>(`/api/admin/datasets/${id}/retire`);
  return data;
}

export async function restoreDataset(id: string): Promise<DatasetActionResult> {
  const { data } = await apiClient.patch<DatasetActionResult>(`/api/admin/datasets/${id}/restore`);
  return data;
}

export async function deleteDataset(id: string, confirmName: string): Promise<DatasetActionResult> {
  const { data } = await apiClient.delete<DatasetActionResult>(`/api/admin/datasets/${id}`, {
    params: { confirmName },
  });
  return data;
}
