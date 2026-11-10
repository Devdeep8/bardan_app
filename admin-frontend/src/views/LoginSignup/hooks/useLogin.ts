"use client";

// src/hooks/useLogin.ts
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authStore } from "@/store/auth.store";
import { ApiError } from "@/services/api.service";

type LoginForm = {
  email: string;
  password: string;
};

type FormErrors = Partial<Record<keyof LoginForm, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_VALUES: LoginForm = { email: "", password: "" };

/**
 * Drives the admin login form: field state, client-side validation,
 * submission via the auth store and navigation on success.
 */
export function useLogin() {
  const router = useRouter();
  const [values, setValues] = useState<LoginForm>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setValue = (field: keyof LoginForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setValues((prev) => ({ ...prev, [field]: value }));
      // Clear the field error as soon as the user edits it again
      setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
      setFormError(null);
    };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!values.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(values.email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }
    if (!values.password) {
      nextErrors.password = "Password is required";
    }
    return nextErrors;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await authStore.login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      router.replace("/dashboard");
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Unable to log in right now. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    values,
    errors,
    formError,
    submitting,
    handleChange: setValue,
    handleSubmit: submit,
  };
}
