import { apiClient } from "@/api/client";

export interface Account {
  username: string;
  email: string;
  role: string;
  displayName: string | null;
  bio: string | null;
  goal: string | null;
  avatarColor: string | null;
  createdAt: string;
}

export interface ProfileUpdate {
  displayName: string;
  email: string;
  bio: string;
  goal: string;
  avatarColor: string;
}

export async function getAccount(): Promise<Account> {
  const { data } = await apiClient.get<Account>("/api/account");
  return data;
}

export async function updateProfile(payload: ProfileUpdate): Promise<Account> {
  const { data } = await apiClient.put<Account>("/api/account/profile", payload);
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.post("/api/account/password", { currentPassword, newPassword });
}
