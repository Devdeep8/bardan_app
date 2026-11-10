"use client";

// src/pages/LoginSignup/components/LoginForm.tsx
import { IconLoader } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { InputControl, PasswordInputControl } from "@/components/form-control";
import { useLogin } from "@/views/LoginSignup/hooks/useLogin";

export function LoginForm() {
  const { values, errors, formError, submitting, handleChange, handleSubmit } = useLogin();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <InputControl
        label="Email"
        name="email"
        type="email"
        placeholder="admin@boatbooking.com"
        autoComplete="email"
        autoFocus
        value={values.email}
        onChange={handleChange("email")}
        error={errors.email}
        disabled={submitting}
      />

      <PasswordInputControl
        label="Password"
        name="password"
        placeholder="••••••••"
        autoComplete="current-password"
        value={values.password}
        onChange={handleChange("password")}
        error={errors.password}
        disabled={submitting}
      />

      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting && <IconLoader className="animate-spin" />}
        {submitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
