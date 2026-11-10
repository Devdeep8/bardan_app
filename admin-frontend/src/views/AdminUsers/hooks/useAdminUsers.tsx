"use client";

// src/views/AdminUsers/hooks/useAdminUsers.tsx
// Admin users page = filter config + column config + a thin wrapper around
// the generic useDataTable hook (same pattern as views/Blogs/hooks/useBlogs).
import { useCallback } from "react";
import { IconHistory, IconPencil, IconTrash } from "@tabler/icons-react";
import { adminUsersService, type AdminUser } from "@/services/admin-users.service";
import { useDataTable } from "@/common/hooks/useDataTable";
import type { DataColumn, FilterConfig } from "@/common/dataTable";

export const ADMIN_USER_FILTERS: FilterConfig[] = [
  { type: "search", key: "q", placeholder: "Search by name or email…", ariaLabel: "Search admin users" }
];

type AdminUserColumnHandlers = {
  onEdit: (adminUser: AdminUser) => void;
  onDelete: (adminUser: AdminUser) => void;
  onViewLogs: (adminUser: AdminUser) => void;
};

export function useAdminUserColumns({
  onEdit,
  onDelete,
  onViewLogs
}: AdminUserColumnHandlers): DataColumn<AdminUser>[] {
  return [
    {
      key: "name",
      header: "Name",
      type: "text",
      accessor: (user) => user.name,
      subAccessor: (user) => user.email
    },
    {
      key: "role",
      header: "Role",
      type: "badge",
      width: "w-32",
      accessor: (user) => user.role.replace("_", " "),
      capitalize: true,
      variants: { "super admin": "default", admin: "secondary", editor: "outline" }
    },
    {
      key: "isActive",
      header: "Status",
      type: "badge",
      width: "w-28",
      accessor: (user) => (user.isActive ? "active" : "inactive"),
      capitalize: true,
      variants: { active: "default", inactive: "destructive" }
    },
    {
      key: "lastLoginAt",
      header: "Last login",
      type: "date",
      width: "w-28",
      accessor: (user) => user.lastLoginAt
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      width: "w-28",
      type: "actions",
      actions: [
        { key: "edit", icon: IconPencil, label: (user) => `Edit ${user.name}`, onClick: onEdit },
        { key: "logs", icon: IconHistory, label: (user) => `View ${user.name}'s activity`, onClick: onViewLogs },
        {
          key: "delete",
          icon: IconTrash,
          label: (user) => `Delete ${user.name}`,
          onClick: onDelete,
          destructive: true
        }
      ]
    }
  ];
}

export function useAdminUsers() {
  const fetcher = useCallback(
    async ({ page, limit, filters }: { page: number; limit: number; filters: Record<string, string> }) => {
      return adminUsersService.list({ page, limit, q: filters.q?.trim() || undefined });
    },
    []
  );

  const table = useDataTable<AdminUser>({
    fetcher,
    initialFilters: { q: "" },
    pageSize: 10
  });

  const remove = (id: string) => table.removeItem(id, adminUsersService.remove);

  return { ...table, remove };
}
