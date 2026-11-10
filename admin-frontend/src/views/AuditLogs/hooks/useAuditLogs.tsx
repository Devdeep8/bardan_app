"use client";

// src/views/AuditLogs/hooks/useAuditLogs.tsx
// Audit logs page = filter config + column config + a thin wrapper around
// the generic useDataTable hook (same pattern as views/Blogs/hooks/useBlogs).
import { useCallback } from "react";
import { IconEye } from "@tabler/icons-react";
import { auditLogsService, type AuditLog } from "@/services/audit-logs.service";
import { useDataTable } from "@/common/hooks/useDataTable";
import type { DataColumn, FilterConfig } from "@/common/dataTable";

export const AUDIT_FILTERS: FilterConfig[] = [
  {
    type: "select",
    key: "action",
    ariaLabel: "Filter by action",
    options: [
      { value: "all", label: "All actions" },
      { value: "login", label: "Login" },
      { value: "login_failed", label: "Failed login" },
      { value: "logout", label: "Logout" },
      { value: "create", label: "Create" },
      { value: "update", label: "Update" },
      { value: "delete", label: "Delete" }
    ]
  },
  {
    type: "select",
    key: "source",
    ariaLabel: "Filter by source",
    options: [
      { value: "all", label: "All sources" },
      { value: "admin-backend", label: "Admin backend" },
      { value: "user-backend", label: "User backend" }
    ]
  },
  {
    type: "search",
    key: "actorEmail",
    placeholder: "Search by actor email…",
    ariaLabel: "Search audit logs by actor email"
  },
  {
    type: "search",
    key: "entity",
    placeholder: "Entity (blog, order…)",
    ariaLabel: "Filter by entity"
  }
];

type AuditColumnHandlers = {
  onView: (log: AuditLog) => void;
};

export function useAuditLogColumns({ onView }: AuditColumnHandlers): DataColumn<AuditLog>[] {
  return [
    {
      key: "createdAt",
      header: "When",
      type: "date",
      width: "w-28",
      accessor: (log) => log.createdAt
    },
    {
      key: "action",
      header: "Action",
      type: "badge",
      width: "w-28",
      accessor: (log) => log.action,
      capitalize: true,
      variants: {
        login: "default",
        logout: "outline",
        login_failed: "destructive",
        create: "default",
        update: "secondary",
        delete: "destructive"
      }
    },
    {
      key: "actor",
      header: "Actor",
      type: "text",
      muted: true,
      width: "w-52",
      accessor: (log) => log.actorEmail ?? "—",
      subAccessor: (log) => log.actorType
    },
    {
      key: "entity",
      header: "Entity",
      type: "text",
      accessor: (log) => log.entity,
      subAccessor: (log) => log.entityId
    },
    {
      key: "source",
      header: "Source",
      type: "badge",
      width: "w-32",
      accessor: (log) => log.source ?? "—"
    },
    {
      key: "ip",
      header: "IP",
      type: "text",
      muted: true,
      width: "w-32",
      accessor: (log) => log.ip ?? "—"
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "w-16",
      type: "actions",
      actions: [
        {
          key: "view",
          icon: IconEye,
          label: (log) => `View ${log.entity} ${log.action} details`,
          onClick: onView
        }
      ]
    }
  ];
}

export function useAuditLogs(initialActorId?: string) {
  const fetcher = useCallback(
    async ({ page, limit, filters }: { page: number; limit: number; filters: Record<string, string> }) => {
      return auditLogsService.list({
        page,
        limit,
        action: filters.action && filters.action !== "all" ? filters.action : undefined,
        entity: filters.entity?.trim() || undefined,
        actorEmail: filters.actorEmail?.trim() || undefined,
        actorId: initialActorId || undefined
      });
    },
    [initialActorId]
  );

  return useDataTable<AuditLog>({
    fetcher,
    initialFilters: { action: "all", source: "all", actorEmail: "", entity: "" },
    pageSize: 15
  });
}
