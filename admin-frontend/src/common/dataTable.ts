// src/common/dataTable.ts
// Shared contract for the generic DataTable + FilterBar.
// A page defines its columns/filters once (in its hook) and the common
// components render them — every table in the app shares one design.

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";
export type ColumnAlign = "left" | "center" | "right";

type ColumnBase = {
  /** Unique id — used as the React key */
  key: string;
  /** Header label */
  header: string;
  align?: ColumnAlign;
  /** Extra classes for this column's th/td */
  className?: string;
  /**
   * Tailwind width class for this column (e.g. "w-28"). The table uses
   * table-fixed, so header widths fully decide the layout — leave one
   * column without a width to absorb the remainder.
   */
  width?: string;
};

/** Icon-button action for an "actions" column */
export type DataAction<T> = {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Accessible label, per row */
  label: (row: T) => string;
  onClick: (row: T) => void;
  destructive?: boolean;
};

/**
 * Column definitions. `type` drives the cell renderer's switch:
 * - text   — string, optional second line (subAccessor), optional muted style
 * - badge  — string rendered as a Badge, variants map value -> badge variant
 * - date   — ISO string formatted as "17 Aug 2026" ("—" when null)
 * - actions— row of icon buttons (edit/delete/…) built from DataAction[]
 * - custom — full escape hatch: render(row)
 */
export type DataColumn<T> =
  | (ColumnBase & {
      type: "text";
      accessor: (row: T) => string;
      subAccessor?: (row: T) => string | null | undefined;
      muted?: boolean;
    })
  | (ColumnBase & {
      type: "badge";
      accessor: (row: T) => string;
      variants?: Record<string, BadgeVariant>;
      capitalize?: boolean;
    })
  | (ColumnBase & {
      type: "date";
      accessor: (row: T) => string | null | undefined;
    })
  | (ColumnBase & {
      type: "actions";
      actions: Array<DataAction<T>>;
    })
  | (ColumnBase & {
      type: "custom";
      render: (row: T) => React.ReactNode;
    });

export type TablePaginationState = {
  page: number;
  totalPages: number;
  totalItems: number;
};

/**
 * Filter definitions for the FilterBar:
 * - search — debounced text input with search icon
 * - select — dropdown built from options
 */
export type FilterConfig =
  | {
      type: "search";
      key: string;
      placeholder?: string;
      ariaLabel?: string;
      widthClassName?: string;
    }
  | {
      type: "select";
      key: string;
      options: Array<{ value: string; label: string }>;
      ariaLabel?: string;
    };

export type FilterValues = Record<string, string>;
