"use client";

// src/components/Pagination.tsx
// Big ‹ page x / y › stepper for paginated lists — same shape as the
// dashboard's month stepper so operators already know how to use it.
// Renders nothing when everything fits on one page.
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

type PaginationProps = {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onChange: (page: number) => void;
};

export function Pagination({ page, totalPages, disabled = false, onChange }: PaginationProps) {
  const { t } = useLanguage();

  if (totalPages <= 1) return null;

  const buttonClass = (enabled: boolean) =>
    `flex size-14 items-center justify-center rounded-xl border-2 text-stone-700 ${
      enabled
        ? "border-stone-300 bg-white hover:bg-stone-50 active:bg-stone-100"
        : "border-stone-200 bg-stone-100 opacity-40"
    } ${disabled ? "pointer-events-none opacity-40" : ""}`;

  return (
    <nav
      aria-label={t("pagination.label")}
      className="mt-4 flex items-center gap-2"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={disabled || page <= 1}
        aria-label={t("pagination.prev")}
        className={buttonClass(page > 1)}
      >
        <ChevronLeft className="size-8" />
      </button>
      <div className="flex h-14 flex-1 items-center justify-center rounded-xl border-2 border-stone-200 bg-white text-xl font-extrabold text-stone-900">
        {t("pagination.page", { current: page, total: totalPages })}
      </div>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={disabled || page >= totalPages}
        aria-label={t("pagination.next")}
        className={buttonClass(page < totalPages)}
      >
        <ChevronRight className="size-8" />
      </button>
    </nav>
  );
}
