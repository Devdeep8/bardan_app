// src/services/api.service.ts
// Base HTTP client for the admin backend API.
// Auth tokens live in httpOnly cookies set by the backend — no localStorage.

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006";

/** Normalized API error thrown by `apiRequest`. */
export class ApiError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code = "REQUEST_FAILED", statusCode = 0) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Access token held in memory only (never localStorage) so requests carry an
// Authorization: Bearer header. The httpOnly cookie remains the durable
// session across page reloads; on reload this is re-populated via /auth/refresh.
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

type ErrorPayload = {
  success: false;
  errors?: { code?: string; statusCode?: number; message?: string };
};

type SuccessPayload<T> = {
  success: true;
  data: T;
  message?: string;
};

/**
 * Fetch wrapper that speaks the backend envelope:
 * `{ success, message, data }` / `{ success: false, errors: { code, message } }`
 * `credentials: "include"` sends/receives the auth cookies.
 * On a 401 it silently refreshes the cookies once and retries the request.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await doRequest<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401 && !NO_RETRY_PATHS.includes(path)) {
      await refreshSession(); // throws if the refresh cookie is dead too
      return doRequest<T>(path, options);
    }
    throw error;
  }
}

// Endpoints that must never trigger the refresh-retry loop
const NO_RETRY_PATHS = ["/api/v1/auth/login", "/api/v1/auth/refresh", "/api/v1/auth/logout"];

async function doRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Unable to reach the server. Please check your connection.", "NETWORK_ERROR");
  }

  const payload = (await response.json().catch(() => null)) as SuccessPayload<T> | ErrorPayload | null;

  if (!response.ok || !payload || payload.success === false) {
    const error = payload && payload.success === false ? payload.errors : undefined;
    throw new ApiError(
      error?.message || `Request failed (${response.status})`,
      error?.code || "REQUEST_FAILED",
      error?.statusCode || response.status,
    );
  }

  return payload.data;
}

// Single-flight refresh: parallel 401s share one /auth/refresh call
let refreshPromise: Promise<void> | null = null;

function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          throw new ApiError("Your session has expired. Please sign in again.", "SESSION_EXPIRED", 401);
        }
        // Keep the in-memory Bearer token in sync with the rotated cookies
        setAuthToken(payload.data?.accessToken ?? null);
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}
