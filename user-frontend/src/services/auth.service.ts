// src/services/auth.service.ts
import { apiRequest } from "./api.service";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserProfile;
  /** Tokens are set as httpOnly cookies by the backend; kept in the body for non-browser clients. */
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  /** POST /api/v1/auth/login — backend sets the auth cookies */
  login: (payload: LoginPayload) =>
    apiRequest<LoginResponse>("/api/v1/auth/login", { method: "POST", body: payload }),

  /** POST /api/v1/auth/refresh — rotates cookies, returns a fresh token pair */
  refresh: () => apiRequest<LoginResponse>("/api/v1/auth/refresh", { method: "POST" }),

  /** GET /api/v1/auth/me */
  getProfile: () => apiRequest<UserProfile>("/api/v1/auth/me"),

  /** POST /api/v1/auth/logout */
  logout: () => apiRequest<Record<string, never>>("/api/v1/auth/logout", { method: "POST" }),
};
