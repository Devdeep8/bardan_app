import { apiRequest } from "./api.service";

export type AuditAction = "login" | "login_failed" | "logout" | "create" | "update" | "delete";

export interface AuditLog {
  id: string;
  actorId: string | null;
  actorType: string | null;
  actorEmail: string | null;
  action: AuditAction | string;
  entity: string;
  entityId: string | null;
  changedFields: Record<string, { before: unknown; after: unknown }> | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
  traceId: string | null;
  source: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface AuditListResponse {
  items: AuditLog[];
  pagination: AuditPagination;
}

export interface AuditListParams {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  entityId?: string;
  actorId?: string;
  actorEmail?: string;
  traceId?: string;
  fromDate?: string;
  toDate?: string;
}

const buildQuery = (params: AuditListParams) => {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  for (const key of ["action", "entity", "entityId", "actorId", "actorEmail", "traceId", "fromDate", "toDate"] as const) {
    const value = params[key];
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
};

export const auditLogsService = {
  /** GET /api/v1/audit-logs — paginated, filterable audit trail */
  list: (params: AuditListParams = {}) =>
    apiRequest<AuditListResponse>(`/api/v1/audit-logs${buildQuery(params)}`),
};
