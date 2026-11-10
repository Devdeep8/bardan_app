"use client";

// src/views/AppUsers/hooks/useAppUsers.tsx
// App users page = filter config + column config + a thin wrapper around
// the generic useDataTable hook (same pattern as views/AdminUsers).
import { useCallback } from "react";
import { IconHistory, IconPencil, IconTrash } from "@tabler/icons-react";
import { usersService, type AppUser } from "@/services/users.service";
import { useDataTable } from "@/common/hooks/useDataTable";
import type { DataColumn, FilterConfig } from "@/common/dataTable";

export const APP_USER_FILTERS: FilterConfig[] = [
  { type: "search", key: "q", placeholder: "Search by name or email…", ariaLabel: "Search app users" }
];

type AppUserColumnHandlers = {
  onEdit: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
  onViewLogs: (user: AppUser) => void;
};

export function useAppUserColumns({
  onEdit,
  onDelete,
  onViewLogs
}: AppUserColumnHandlers): DataColumn<AppUser>[] {
  return [
    {
      key: "name",
      header: "Name",
      type: "text",
      accessor: (user) => user.name,
      subAccessor: (user) => user.email
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
      key: "createdAt",
      header: "Added",
      type: "date",
      width: "w-28",
      accessor: (user) => user.createdAt
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

export function useAppUsers() {
  const fetcher = useCallback(
    async ({ page, limit, filters }: { page: number; limit: number; filters: Record<string, string> }) => {
      return usersService.list({ page, limit, q: filters.q?.trim() || undefined });
    },
    []
  );

  const table = useDataTable<AppUser>({
    fetcher,
    initialFilters: { q: "" },
    pageSize: 10
  });

  const remove = (id: string) => table.removeItem(id, usersService.remove);

  return { ...table, remove };
}
