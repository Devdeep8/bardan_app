"use client";

// src/components/form-control/Input.tsx
// Reusable text input built on shadcn/ui Field primitives.
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type InputProps = React.ComponentProps<"input"> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function InputControl({ label, error, hint, id, name, ...props }: InputProps) {
  const inputId = id ?? name;

  return (
    <Field data-invalid={error ? true : undefined}>
      {label && <FieldLabel htmlFor={inputId}>{label}</FieldLabel>}
      <Input id={inputId} name={name} aria-invalid={error ? true : undefined} {...props} />
      {error ? (
        <FieldError>{error}</FieldError>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </Field>
  );
}
