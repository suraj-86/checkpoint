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
