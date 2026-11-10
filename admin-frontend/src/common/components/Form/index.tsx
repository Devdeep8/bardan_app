"use client";

// src/common/components/Form/index.tsx
// CommonForm — config-driven form (shadcn/Base UI port of the MUI pattern):
// a page declares `controls` + `validationSchema`, this component renders
// fields by a switch on control.type, handles visibility rules (visibleIf)
// and the 12-column grid. Submit buttons can be passed as children —
// either nodes or a render-prop receiving { isSubmitting }.
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type FormEvent
} from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { RichTextEditor } from "@/common/components/RichTextEditor";
import { ImageUpload, type EditableImage } from "@/common/components/ImageUpload";
import { gridSpanClasses, type FormControlGrid } from "@/common/constants/form";
import {
  useForm,
  type FormValues,
  type ValidationSchema
} from "@/common/components/Form/hooks/useForm";
import { cn } from "@/lib/utils";

export type FormSelectOption = { value: string; label: string };

export type FormControlConfig = {
  name: string;
  type: "input" | "textarea" | "select" | "richtext" | "images";
  label?: string;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  /** input[type] for "input" controls (text, password, number, email…) */
  inputType?: string;
  /** static list or a function of the current values */
  options?: FormSelectOption[] | ((values: FormValues) => FormSelectOption[]);
  rows?: number;
  /**
   * Auto-derive this field's value from another field (e.g. slug from title).
   * Follows the source until the user edits this field manually; clearing
   * the field resumes auto-generation.
   */
  autoFrom?: {
    field: string;
    transform: (value: string) => string;
  };
  grid?: FormControlGrid;
  /** Show/hide this control based on another field's value */
  visibleIf?: {
    field: string;
    equals?: unknown;
    notEquals?: unknown;
    in?: unknown[];
    notIn?: unknown[];
  };
};

export type CommonFormRef = {
  resetForm: (nextValues?: FormValues) => void;
  setErrors: (errors: Record<string, string>) => void;
};

type CommonFormProps = {
  controls: FormControlConfig[];
  initialValues?: FormValues;
  validationSchema?: ValidationSchema;
  onSubmit: (values: FormValues) => void | Promise<void>;
  /** Rendered inside the form after the fields — e.g. footer buttons */
  children?: React.ReactNode | ((state: { isSubmitting: boolean }) => React.ReactNode);
  className?: string;
};

const computeVisibility = (control: FormControlConfig, values: FormValues): boolean => {
  const condition = control.visibleIf;
  if (!condition?.field) return true;

  const current = values[condition.field];
  if (Object.prototype.hasOwnProperty.call(condition, "equals")) {
    return current === condition.equals;
  }
  if (Object.prototype.hasOwnProperty.call(condition, "notEquals")) {
    return current !== condition.notEquals;
  }
  if (Array.isArray(condition.in)) {
    return condition.in.includes(current);
  }
  if (Array.isArray(condition.notIn)) {
    return !condition.notIn.includes(current);
  }
  return true;
};

export const CommonForm = forwardRef<CommonFormRef, CommonFormProps>(
  ({ controls, initialValues = {}, validationSchema = {}, onSubmit, children, className }, ref) => {
    const [isSubmitting, setSubmitting] = useState(false);
    const {
      values,
      errors,
      setErrors,
      handleChange,
      handleBlur,
      validateForm,
      resetForm,
      getFieldProps
    } = useForm(initialValues, validationSchema);

    // Expose form methods to the parent (like the MUI version)
    useImperativeHandle(ref, () => ({ resetForm, setErrors }));

    // ---- autoFrom (e.g. slug auto-generated from title) ----
    // A derived field follows its source until the user edits it manually;
    // clearing the field resumes auto-generation.
    const manualFields = useRef<Set<string>>(new Set());
    const lastAutoValues = useRef<Record<string, string>>({});

    const controlsByAutoSource = useMemo(() => {
      const map = new Map<string, FormControlConfig[]>();
      controls.forEach((control) => {
        if (!control.autoFrom) return;
        const existing = map.get(control.autoFrom.field) ?? [];
        existing.push(control);
        map.set(control.autoFrom.field, existing);
      });
      return map;
    }, [controls]);

    const autoControls = useMemo(
      () => controls.filter((control) => !!control.autoFrom),
      [controls]
    );

    const handleChangeWithAuto = useCallback(
      (name: string, value: unknown) => {
        const stringValue = typeof value === "string" ? value : "";
        const ownControl = autoControls.find((control) => control.name === name);

        // Track manual edits on derived fields; clearing resumes auto mode
        if (ownControl?.autoFrom) {
          if (stringValue === "") {
            manualFields.current.delete(name);
          } else {
            manualFields.current.add(name);
          }
        }

        handleChange(name, value);

        // Source field changed -> re-derive targets that are still in auto mode
        controlsByAutoSource.get(name)?.forEach((target) => {
          if (!target.autoFrom || manualFields.current.has(target.name)) return;
          const current = typeof values[target.name] === "string" ? (values[target.name] as string) : "";
          // Only override when empty or still holding our own last value
          if (current === "" || current === lastAutoValues.current[target.name]) {
            const derived = target.autoFrom.transform(stringValue);
            lastAutoValues.current[target.name] = derived;
            handleChange(target.name, derived);
          }
        });

        // Derived field cleared -> immediately refill from its current source
        if (ownControl?.autoFrom && stringValue === "") {
          const derived = ownControl.autoFrom.transform(String(values[ownControl.autoFrom.field] ?? ""));
          lastAutoValues.current[name] = derived;
          handleChange(name, derived);
        }
      },
      [autoControls, controlsByAutoSource, handleChange, values]
    );

    const visibleControls = controls.filter((control) => computeVisibility(control, values));
    const visibleFieldNames = visibleControls.map((control) => control.name);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      // Validate only visible fields
      const { isValid, errors: validationErrors } = validateForm(visibleFieldNames);
      if (!isValid) {
        setErrors(validationErrors);
        return;
      }

      setSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setSubmitting(false);
      }
    };

    // Render a single field by type
    const renderField = (control: FormControlConfig) => {
      const { name, label, placeholder, hint, disabled, inputType, rows = 4 } = control;
      const error = errors[name] || undefined;
      const fieldDisabled = !!disabled || isSubmitting;

      const wrap = (content: React.ReactNode) => (
        <Field data-invalid={error ? true : undefined}>
          {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
          {content}
          {error ? (
            <FieldError>{error}</FieldError>
          ) : hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </Field>
      );

      switch (control.type) {
        case "input":
          return wrap(
            <Input
              id={name}
              type={inputType || "text"}
              placeholder={placeholder}
              disabled={fieldDisabled}
              aria-invalid={error ? true : undefined}
              {...getFieldProps(name)}
              onChange={(event) => handleChangeWithAuto(name, event.target.value)}
            />
          );

        case "textarea":
          return wrap(
            <Textarea
              id={name}
              rows={rows}
              placeholder={placeholder}
              disabled={fieldDisabled}
              aria-invalid={error ? true : undefined}
              {...getFieldProps(name)}
              onChange={(event) => handleChangeWithAuto(name, event.target.value)}
            />
          );

        case "select": {
          const options =
            typeof control.options === "function" ? control.options(values) : control.options ?? [];
          return wrap(
            <Select
              items={options}
              value={(values[name] as string) ?? options[0]?.value}
              onValueChange={(value) => handleChangeWithAuto(name, value ?? options[0]?.value ?? "")}
            >
              <SelectTrigger id={name} className="w-full" aria-label={label} disabled={fieldDisabled}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        case "richtext":
          return wrap(
            <RichTextEditor
              value={(values[name] as string) ?? ""}
              onChange={(html) => handleChangeWithAuto(name, html)}
              placeholder={placeholder}
              disabled={fieldDisabled}
              error={error}
            />
          );

        case "images":
          return wrap(
            <ImageUpload
              value={Array.isArray(values[name]) ? (values[name] as EditableImage[]) : []}
              onChange={(images) => handleChangeWithAuto(name, images)}
              disabled={fieldDisabled}
              error={error}
            />
          );

        default:
          return null;
      }
    };

    return (
      <form onSubmit={handleSubmit} className={cn("grid grid-cols-12 gap-4", className)} noValidate>
        {visibleControls.map((control) => (
          <div key={control.name} className={gridSpanClasses(control.grid)}>
            {renderField(control)}
          </div>
        ))}

        <div className="col-span-12">
          {typeof children === "function" ? children({ isSubmitting }) : children}
        </div>
      </form>
    );
  }
);

CommonForm.displayName = "CommonForm";
