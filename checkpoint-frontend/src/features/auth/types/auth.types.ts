export type Role = "STUDENT" | "ADMIN";

export interface User {
  id: string;
  username: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  path: string;
  errors?: Record<string, string>;
}
