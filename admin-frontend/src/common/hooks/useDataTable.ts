"use client";

// src/common/hooks/useDataTable.ts
// Generic data-table state hook. A page wraps this with its own fetcher and
// filter config (see views/Blogs/hooks/useBlogs.ts) and passes the result to
// the common DataTable + FilterBar — no table plumbing per page.
import { useCallback, useEffect, useState } from "react";
import type { FilterValues, TablePaginationState } from "@/common/dataTable";

type UseDataTableArgs<T> = {
  /** Fetch a page of data for the current filters. Throw ApiError on failure. */
  fetcher: (params: {
    page: number;
    limit: number;
    filters: FilterValues;
  }) => Promise<{ items: T[]; pagination: TablePaginationState }>;
  initialFilters?: FilterValues;
  pageSize?: number;
  /** Debounce so typing in a search filter doesn't fire a request per key */
  debounceMs?: number;
};

export function useDataTable<T>({
  fetcher,
  initialFilters = {},
  pageSize = 10,
  debounceMs = 350
}: UseDataTableArgs<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<TablePaginationState>({
    page: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [page, setPage] = useState(1);

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Filters changed -> back to the first page
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher({ page, limit: pageSize, filters });
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [fetcher, page, pageSize, filters]);

  useEffect(() => {
    const timer = setTimeout(fetchPage, debounceMs);
    return () => clearTimeout(timer);
  }, [fetchPage, debounceMs]);

  /**
   * Delete an item then refresh — steps back a page if we removed the
   * last item on the last page.
   */
  const removeItem = useCallback(
    async (id: string, remove: (id: string) => Promise<unknown>) => {
      await remove(id);
      if (items.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await fetchPage();
      }
    },
    [items.length, page, fetchPage]
  );

  return {
    items,
    pagination,
    loading,
    error,
    filters,
    setFilter,
    page,
    setPage,
    refresh: fetchPage,
    removeItem
  };
}
