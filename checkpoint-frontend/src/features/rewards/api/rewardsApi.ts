import { apiClient } from "@/api/client";
import type { AdminMilestone, AdminOdds, AdminRewards, ChestOpenResult, EquipRequest, RewardsState } from "../types/rewards.types";

export async function getRewards(): Promise<RewardsState> {
  const { data } = await apiClient.get<RewardsState>("/api/rewards");
  return data;
}

export async function openChest(id: string): Promise<ChestOpenResult> {
  const { data } = await apiClient.post<ChestOpenResult>(`/api/rewards/chests/${id}/open`);
  return data;
}

export async function equip(request: EquipRequest): Promise<void> {
  await apiClient.put("/api/rewards/equip", request);
}

export async function getAdminRewards(): Promise<AdminRewards> {
  const { data } = await apiClient.get<AdminRewards>("/api/admin/rewards");
  return data;
}

export async function updateRewardItem(id: string, body: { enabled: boolean; name: string }): Promise<void> {
  await apiClient.put(`/api/admin/rewards/items/${id}`, body);
}

export async function updateOdds(odds: AdminOdds[]): Promise<void> {
  await apiClient.put("/api/admin/rewards/odds", { odds });
}

export async function updateMilestones(milestones: AdminMilestone[]): Promise<void> {
  await apiClient.put("/api/admin/rewards/milestones", { milestones });
}
