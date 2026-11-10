// src/common/permissions.ts
// Central permission map: declare a permission once, list which (non-super)
// roles have it. super_admin implicitly has everything.
import type { AdminRole } from "@/services/auth.service";

export const PERMISSIONS = [
  "dashboard.view",
  "cms.view",
  "cms.blogs.view",
  "audit.view",
  "users.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_ROLES: Record<Permission, readonly AdminRole[]> = {
  "dashboard.view": ["admin", "editor"],
  "cms.view": ["admin", "editor"],
  "cms.blogs.view": ["admin", "editor"],
  "audit.view": ["admin"],
  "users.view": ["admin"],
};

export const hasPermission = (
  role: AdminRole | null | undefined,
  permission: Permission
): boolean => {
  if (!role) return false;
  if (role === "super_admin") return true;
  return PERMISSION_ROLES[permission]?.includes(role) ?? false;
};

export const hasAnyPermission = (
  role: AdminRole | null | undefined,
  permissions: readonly Permission[]
): boolean => permissions.some((permission) => hasPermission(role, permission));
