"use client";

// src/views/AdminUsers/hooks/useAdminUserForm.ts
// Admin user create/edit = form controls config + validation schema + submit glue.
import { useMemo, useState } from "react";
import { adminUsersService, type AdminUser } from "@/services/admin-users.service";
import { ApiError } from "@/services/api.service";
import type { FormControlConfig } from "@/common/components/Form";
import type { ValidationSchema } from "@/common/components/Form/hooks/useForm";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "super_admin", label: "Super admin" }
];

export const ADMIN_USER_FORM_CONTROLS: FormControlConfig[] = [
  {
    name: "name",
    type: "input",
    label: "Name",
    placeholder: "Full name",
    grid: { md: 6 }
  },
  {
    name: "email",
    type: "input",
    inputType: "email",
    label: "Email",
    placeholder: "name@example.com",
    grid: { md: 6 }
  },
  {
    name: "role",
    type: "select",
    label: "Role",
    options: ROLE_OPTIONS,
    grid: { md: 6 }
  },
  {
    name: "isActive",
    type: "select",
    label: "Status",
    options: [
      { value: "true", label: "Active" },
      { value: "false", label: "Deactivated" }
    ],
    // Only meaningful when editing — hide it on create (new users are active)
    visibleIf: { field: "id", notEquals: "" },
    grid: { md: 6 }
  },
  {
    name: "password",
    type: "input",
    inputType: "password",
    label: "Password",
    placeholder: "Minimum 8 characters",
    hint: "Leave empty when editing to keep the current password",
    grid: { md: 12 }
  }
];

export const ADMIN_USER_FORM_VALIDATION: ValidationSchema = {
  name: { required: "Name is required", maxLength: 100 },
  email: { required: "Email is required", maxLength: 200 },
  role: { required: "Role is required" },
  password: { required: "Password is required (min 8 characters)", minLength: 8 }
};

type UseAdminUserSubmitArgs = {
  /** null = create, adminUser = edit */
  adminUser: AdminUser | null;
  onSaved: () => void;
};

export function useAdminUserSubmit({ adminUser, onSaved }: UseAdminUserSubmitArgs) {
  const [formError, setFormError] = useState<string | null>(null);

  const initialValues = useMemo(
    () => ({
      id: adminUser?.id ?? "",
      name: adminUser?.name ?? "",
      email: adminUser?.email ?? "",
      role: adminUser?.role ?? "admin",
      isActive: adminUser ? String(adminUser.isActive) : "true",
      password: ""
    }),
    [adminUser]
  );

  // Password optional when editing (empty = keep current), required on create
  const validationSchema: ValidationSchema = adminUser
    ? {
        ...ADMIN_USER_FORM_VALIDATION,
        password: {
          validate: (value: unknown) =>
            !value || String(value).trim().length >= 8
              ? undefined
              : "Must be at least 8 characters"
        }
      }
    : ADMIN_USER_FORM_VALIDATION;

  const handleSubmit = async (values: Record<string, unknown>) => {
    setFormError(null);
    try {
      const password = String(values.password ?? "").trim();
      const isActive = String(values.isActive) === "true";

      if (adminUser) {
        await adminUsersService.update(adminUser.id, {
          name: String(values.name ?? "").trim(),
          email: String(values.email ?? "").trim().toLowerCase(),
          role: values.role as AdminUser["role"],
          isActive,
          ...(password ? { password } : {})
        });
      } else {
        await adminUsersService.create({
          name: String(values.name ?? "").trim(),
          email: String(values.email ?? "").trim().toLowerCase(),
          password,
          role: values.role as AdminUser["role"]
        });
      }
      onSaved();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save the admin user");
    }
  };

  return { initialValues, validationSchema, formError, handleSubmit };
}
