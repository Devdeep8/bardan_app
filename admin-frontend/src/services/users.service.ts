import { apiRequest } from "./api.service";

/** A user-backend app user (managed by admins from this backend) */
export interface AppUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppUserPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface AppUserListResponse {
  items: AppUser[];
  pagination: AppUserPagination;
}

export interface AppUserListParams {
  page?: number;
  limit?: number;
  q?: string;
}

/** Fields the create/edit form sends */
export interface AppUserFormPayload {
  name?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
}

const buildQuery = (params: AppUserListParams) => {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.q) search.set("q", params.q);
  const query = search.toString();
  return query ? `?${query}` : "";
};

export const usersService = {
  /** GET /api/v1/users */
  list: (params: AppUserListParams = {}) =>
    apiRequest<AppUserListResponse>(`/api/v1/users${buildQuery(params)}`),

  /** GET /api/v1/users/:id */
  get: (id: string) => apiRequest<AppUser>(`/api/v1/users/${id}`),

  /** POST /api/v1/users (super admin only) */
  create: (payload: AppUserFormPayload & { name: string; email: string; password: string }) =>
    apiRequest<AppUser>("/api/v1/users", { method: "POST", body: payload }),

  /** PATCH /api/v1/users/:id (super admin only) */
  update: (id: string, payload: Partial<AppUserFormPayload>) =>
    apiRequest<AppUser>(`/api/v1/users/${id}`, { method: "PATCH", body: payload }),

  /** DELETE /api/v1/users/:id (super admin only) */
  remove: (id: string) =>
    apiRequest<{ id: string; deleted: boolean }>(`/api/v1/users/${id}`, { method: "DELETE" }),
};
