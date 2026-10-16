import { apiClient } from "@/api/client";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../types/auth.types";

export async function registerRequest(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/api/auth/register", payload);
  return data;
}

export async function loginRequest(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/api/auth/login", payload);
  return data;
}

export interface UsernameCheck {
  username: string;
  available: boolean;
  reason: string;
  message: string;
}

export async function checkUsername(username: string): Promise<UsernameCheck> {
  const { data } = await apiClient.get<UsernameCheck>("/api/auth/username-available", { params: { username } });
  return data;
}
