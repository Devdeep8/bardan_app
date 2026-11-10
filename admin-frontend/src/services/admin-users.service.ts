import { apiRequest } from "./api.service";
import type { AdminRole } from "./auth.service";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface AdminUserListResponse {
  items: AdminUser[];
  pagination: AdminUserPagination;
}

export interface AdminUserListParams {
  page?: number;
  limit?: number;
  q?: string;
}

/** Fields the create/edit form sends */
export interface AdminUserFormPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: AdminRole;
  isActive?: boolean;
}

const buildQuery = (params: AdminUserListParams) => {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.q) search.set("q", params.q);
  const query = search.toString();
  return query ? `?${query}` : "";
};

export const adminUsersService = {
  /** GET /api/v1/admin-users */
  list: (params: AdminUserListParams = {}) =>
    apiRequest<AdminUserListResponse>(`/api/v1/admin-users${buildQuery(params)}`),

  /** GET /api/v1/admin-users/:id */
  get: (id: string) => apiRequest<AdminUser>(`/api/v1/admin-users/${id}`),

  /** POST /api/v1/admin-users (super admin only) */
  create: (payload: AdminUserFormPayload & { name: string; email: string; password: string; role: AdminRole }) =>
    apiRequest<AdminUser>("/api/v1/admin-users", { method: "POST", body: payload }),

  /** PATCH /api/v1/admin-users/:id (super admin only) */
  update: (id: string, payload: Partial<AdminUserFormPayload>) =>
    apiRequest<AdminUser>(`/api/v1/admin-users/${id}`, { method: "PATCH", body: payload }),

  /** DELETE /api/v1/admin-users/:id (super admin only) */
  remove: (id: string) =>
    apiRequest<{ id: string; deleted: boolean }>(`/api/v1/admin-users/${id}`, { method: "DELETE" }),
};
