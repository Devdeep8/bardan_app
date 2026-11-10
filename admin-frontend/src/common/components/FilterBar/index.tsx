"use client";

// src/common/FilterBar/index.tsx
// Generic filter toolbar. Pages pass filter config from their hook plus the
// current values; each filter renders by a switch on filter.type.
import { IconSearch } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { FilterConfig, FilterValues } from "@/common/dataTable";
import { cn } from "@/lib/utils";

type FilterBarProps = {
  config: FilterConfig[];
  values: FilterValues;
  onChange: (key: string, value: string) => void;
};

export function FilterBar({ config, values, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {config.map((filter) => {
        switch (filter.type) {
          case "search":
            return (
              <div key={filter.key} className={cn("relative w-full sm:w-64", filter.widthClassName)}>
                <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder={filter.placeholder}
                  aria-label={filter.ariaLabel ?? filter.placeholder}
                  value={values[filter.key] ?? ""}
                  onChange={(event) => onChange(filter.key, event.target.value)}
                />
              </div>
            );

          case "select":
            return (
              <Select
                key={filter.key}
                items={filter.options}
                value={values[filter.key] ?? filter.options[0]?.value}
                onValueChange={(value) => onChange(filter.key, value ?? filter.options[0]?.value ?? "")}
              >
                <SelectTrigger aria-label={filter.ariaLabel} className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
        }
      })}
    </div>
  );
}
