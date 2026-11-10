"use client";

// src/common/components/Form/hooks/useForm.ts
// Common form state hook: values, per-field errors, validation, submit state.
// Driven by CommonForm but usable on its own.
import { useCallback, useState } from "react";

export type ValidationRule = {
  /** true or a custom message */
  required?: boolean | string;
  minLength?: number;
  maxLength?: number;
  pattern?: { value: RegExp; message: string };
  /** Custom check — return a message or undefined when valid */
  validate?: (value: unknown, values: Record<string, unknown>) => string | undefined | null;
};

export type ValidationSchema = Record<string, ValidationRule>;

export type FormValues = Record<string, unknown>;

const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

export function useForm(initialValues: FormValues = {}, validationSchema: ValidationSchema = {}) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback(
    (name: string): string | undefined => {
      const rule = validationSchema[name];
      if (!rule) return undefined;

      const value = values[name];

      if (rule.required !== undefined && rule.required !== false && isEmpty(value)) {
        return typeof rule.required === "string" ? rule.required : "This field is required";
      }
      if (typeof value === "string") {
        if (rule.minLength && value.trim().length < rule.minLength) {
          return `Must be at least ${rule.minLength} characters`;
        }
        if (rule.maxLength && value.trim().length > rule.maxLength) {
          return `Must be ${rule.maxLength} characters or fewer`;
        }
        if (rule.pattern && value && !rule.pattern.value.test(value)) {
          return rule.pattern.message;
        }
      }
      return rule.validate?.(value, values) ?? undefined;
    },
    [validationSchema, values]
  );

  const handleChange = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear the field error as soon as the user edits it again
    setErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
  }, []);

  const handleBlur = useCallback(
    (name: string) => {
      const message = validateField(name);
      setErrors((prev) => (message ? { ...prev, [name]: message } : prev));
    },
    [validateField]
  );

  /** Validate (optionally only the visible fields). Returns all errors found. */
  const validateForm = useCallback(
    (visibleFieldNames?: string[]): { isValid: boolean; errors: Record<string, string> } => {
      const names = visibleFieldNames ?? Object.keys(validationSchema);
      const nextErrors: Record<string, string> = {};
      names.forEach((name) => {
        const message = validateField(name);
        if (message) nextErrors[name] = message;
      });
      return { isValid: Object.keys(nextErrors).length === 0, errors: nextErrors };
    },
    [validationSchema, validateField]
  );

  const resetForm = useCallback((nextValues?: FormValues) => {
    setValues(nextValues ?? {});
    setErrors({});
  }, []);

  /** Props for plain input/textarea controls */
  const getFieldProps = useCallback(
    (name: string) => ({
      name,
      value: (values[name] ?? "") as string,
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => handleChange(name, event.target.value),
      onBlur: () => handleBlur(name),
      error: errors[name] || undefined
    }),
    [values, errors, handleChange, handleBlur]
  );

  return {
    values,
    errors,
    setErrors,
    handleChange,
    handleBlur,
    validateField,
    validateForm,
    resetForm,
    getFieldProps
  };
}
