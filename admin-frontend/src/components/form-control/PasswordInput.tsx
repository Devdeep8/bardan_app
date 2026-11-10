"use client";

// src/components/form-control/PasswordInput.tsx
// Reusable password input with a show/hide toggle, built on shadcn/ui.
import { useState } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type PasswordInputProps = React.ComponentProps<"input"> & {
  label?: string;
  error?: string;
};

export function PasswordInputControl({ label, error, id, name, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? name;

  return (
    <Field data-invalid={error ? true : undefined}>
      {label && <FieldLabel htmlFor={inputId}>{label}</FieldLabel>}
      <div className="relative">
        <Input
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          className={`pr-10 ${className ?? ""}`}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          tabIndex={-1}
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 my-auto size-7 text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </Button>
      </div>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
