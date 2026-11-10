"use client";

// src/views/AppUsers/hooks/useAppUserForm.ts
// App user create/edit = form controls config + validation schema + submit glue.
import { useMemo, useState } from "react";
import { usersService, type AppUser } from "@/services/users.service";
import { ApiError } from "@/services/api.service";
import type { FormControlConfig } from "@/common/components/Form";
import type { ValidationSchema } from "@/common/components/Form/hooks/useForm";

export const APP_USER_FORM_CONTROLS: FormControlConfig[] = [
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

export const APP_USER_FORM_VALIDATION: ValidationSchema = {
  name: { required: "Name is required", maxLength: 100 },
  email: { required: "Email is required", maxLength: 200 },
  password: { required: "Password is required (min 8 characters)", minLength: 8 }
};

type UseAppUserSubmitArgs = {
  /** null = create, user = edit */
  user: AppUser | null;
  onSaved: () => void;
};

export function useAppUserSubmit({ user, onSaved }: UseAppUserSubmitArgs) {
  const [formError, setFormError] = useState<string | null>(null);

  const initialValues = useMemo(
    () => ({
      id: user?.id ?? "",
      name: user?.name ?? "",
      email: user?.email ?? "",
      isActive: user ? String(user.isActive) : "true",
      password: ""
    }),
    [user]
  );

  // Password optional when editing (empty = keep current), required on create
  const validationSchema: ValidationSchema = user
    ? {
        ...APP_USER_FORM_VALIDATION,
        password: {
          validate: (value: unknown) =>
            !value || String(value).trim().length >= 8
              ? undefined
              : "Must be at least 8 characters"
        }
      }
    : APP_USER_FORM_VALIDATION;

  const handleSubmit = async (values: Record<string, unknown>) => {
    setFormError(null);
    try {
      const password = String(values.password ?? "").trim();
      const isActive = String(values.isActive) === "true";

      if (user) {
        await usersService.update(user.id, {
          name: String(values.name ?? "").trim(),
          email: String(values.email ?? "").trim().toLowerCase(),
          isActive,
          ...(password ? { password } : {})
        });
      } else {
        await usersService.create({
          name: String(values.name ?? "").trim(),
          email: String(values.email ?? "").trim().toLowerCase(),
          password
        });
      }
      onSaved();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to save the user");
    }
  };

  return { initialValues, validationSchema, formError, handleSubmit };
}
