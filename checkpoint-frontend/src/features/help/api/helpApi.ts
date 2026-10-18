import { apiClient } from "@/api/client";
import type { PageResponse } from "../../progress/types/progress.types";

export type SupportKind = "TOPIC_REQUEST" | "FEEDBACK" | "BUG";
export type SupportStatus = "OPEN" | "DONE";

export interface SupportRequestItem {
  id: string;
  kind: SupportKind;
  subject: string | null;
  message: string;
  status: SupportStatus;
  createdAt: string;
}

export interface AdminSupportItem extends SupportRequestItem {
  username: string;
  resolvedAt: string | null;
}

export const KIND_LABELS: Record<SupportKind, string> = {
  TOPIC_REQUEST: "Topic request",
  FEEDBACK: "Feedback",
  BUG: "Problem",
};

export async function createSupportRequest(body: {
  kind: SupportKind;
  subject: string;
  message: string;
}): Promise<SupportRequestItem> {
  const { data } = await apiClient.post<SupportRequestItem>("/api/help/requests", body);
  return data;
}

export async function listMyRequests(): Promise<SupportRequestItem[]> {
  const { data } = await apiClient.get<SupportRequestItem[]>("/api/help/requests");
  return data;
}

export async function listAdminRequests(status: SupportStatus | "", page: number): Promise<PageResponse<AdminSupportItem>> {
  const { data } = await apiClient.get<PageResponse<AdminSupportItem>>("/api/admin/support", {
    params: { status: status || undefined, page, size: 20 },
  });
  return data;
}

export async function setRequestStatus(id: string, status: SupportStatus): Promise<AdminSupportItem> {
  const { data } = await apiClient.patch<AdminSupportItem>(`/api/admin/support/${id}`, { status });
  return data;
}
