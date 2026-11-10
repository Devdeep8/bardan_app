"use client";

// src/common/DataTable/index.tsx
// Generic data table. Pages pass column config from their hook; cells are
// rendered by a switch on column.type so every table looks the same.
//
// Layout stability (no shift on filter change / loading / any data):
// - table-fixed: header widths decide the layout, content can't resize columns
// - while loading with existing data, rows stay put and just dim
// - first load (no data yet) shows skeleton rows with the same geometry
// - the pagination footer is always rendered (buttons just disable)
import {
  IconChevronLeft,
  IconChevronRight
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type {
  DataColumn,
  TablePaginationState
} from "@/common/dataTable";
import { cn } from "@/lib/utils";

const ALIGN_CLASSES = {
  left: "text-left",
  center: "text-center",
  right: "text-right"
} as const;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Renders a single cell — the switch that makes columns declarative */
function DataTableCell<T>({ column, row }: { column: DataColumn<T>; row: T }) {
  switch (column.type) {
    case "text": {
      const text = column.accessor(row);
      const subText = column.subAccessor?.(row);
      return (
        <div className="min-w-0">
          <div className={cn("truncate text-sm", subText && "font-medium", column.muted && "text-muted-foreground")}>
            {text}
          </div>
          {subText && <div className="truncate text-xs text-muted-foreground">{subText}</div>}
        </div>
      );
    }

    case "badge": {
      const value = column.accessor(row);
      return (
        <Badge
          variant={column.variants?.[value] ?? "default"}
          className={column.capitalize ? "capitalize" : undefined}
        >
          {value}
        </Badge>
      );
    }

    case "date": {
      const iso = column.accessor(row);
      return <span className="text-sm whitespace-nowrap text-muted-foreground">{iso ? formatDate(iso) : "—"}</span>;
    }

    case "actions":
      return (
        <div className={cn("flex gap-1", column.align === "right" && "justify-end")}>
          {column.actions.map((action) => (
            <Button
              key={action.key}
              variant="ghost"
              size="icon-sm"
              aria-label={action.label(row)}
              className={
                action.destructive
                  ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                  : undefined
              }
              onClick={() => action.onClick(row)}
            >
              <action.icon />
            </Button>
          ))}
        </div>
      );

    case "custom":
      return <>{column.render(row)}</>;
  }
}

/** Skeleton body for first load — same geometry as a data row */
function SkeletonRows<T>({ columns, rows }: { columns: Array<DataColumn<T>>; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <TableRow key={`skeleton-${rowIndex}`}>
          {columns.map((column) => (
            <TableCell key={column.key} className="py-3.5">
              <Skeleton className={cn("h-4", column.key === columns[0].key ? "w-3/5" : "w-4/5")} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

type DataTableProps<T> = {
  columns: Array<DataColumn<T>>;
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  pagination?: TablePaginationState | null;
  onPageChange?: (page: number) => void;
  /** Skeleton rows for first load — match your page size so heights line up */
  skeletonRows?: number;
};

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  error = null,
  onRetry,
  emptyMessage = "No records found.",
  pagination = null,
  onPageChange,
  skeletonRows = 8
}: DataTableProps<T>) {
  const colSpan = columns.length;
  // Show skeletons only when there is nothing on screen yet
  const showSkeletons = loading && !error && data.length === 0;
  // Keep existing rows while refetching (dim instead of swapping to "Loading…")
  const dimRows = loading && !error && data.length > 0;

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Table className="table-fixed min-w-[640px]">
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(column.width, column.align && ALIGN_CLASSES[column.align], column.className)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className={cn(dimRows && "opacity-60 pointer-events-none transition-opacity")}>
          {error && (
            <TableRow>
              <TableCell colSpan={colSpan} className="py-10 text-center text-sm text-destructive">
                {error}
                {onRetry && (
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={onRetry}>
                      Retry
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          )}

          {!error && showSkeletons && <SkeletonRows columns={columns} rows={skeletonRows} />}

          {!error && !showSkeletons && !dimRows && data.length === 0 && (
            <TableRow>
              <TableCell colSpan={colSpan} className="py-10 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}

          {!error && data.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(column.width, column.align && ALIGN_CLASSES[column.align], column.className)}
                >
                  <DataTableCell column={column} row={row} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Footer is always present while paginating — only the buttons disable */}
      {pagination && (
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
          <span>
            {pagination.totalItems} item{pagination.totalItems === 1 ? "" : "s"} · page{" "}
            {pagination.page} of {Math.max(pagination.totalPages, 1)}
          </span>
          {onPageChange && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous page"
                disabled={pagination.page <= 1 || loading}
                onClick={() => onPageChange(pagination.page - 1)}
              >
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next page"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => onPageChange(pagination.page + 1)}
              >
                <IconChevronRight />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
