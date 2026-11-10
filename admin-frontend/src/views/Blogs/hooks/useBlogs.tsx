/* eslint-disable @next/next/no-img-element */
"use client";

// src/views/Blogs/hooks/useBlogs.ts
// Blogs page = filter config + column config + a thin wrapper around the
// generic useDataTable hook. All table/filter UI lives in common/.
import { useCallback } from "react";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { blogsService, type Blog, type BlogStatus } from "@/services/blogs.service";
import { useDataTable } from "@/common/hooks/useDataTable";
import type { DataColumn, FilterConfig } from "@/common/dataTable";

// FilterBar config — rendered by the common FilterBar
export const BLOG_FILTERS: FilterConfig[] = [
  { type: "search", key: "q", placeholder: "Search by title…", ariaLabel: "Search blogs" },
  {
    type: "select",
    key: "status",
    ariaLabel: "Filter by status",
    options: [
      { value: "all", label: "All statuses" },
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
      { value: "archived", label: "Archived" }
    ]
  }
];

type BlogColumnHandlers = {
  onEdit: (blog: Blog) => void;
  onDelete: (blog: Blog) => void;
};

// DataTable columns — rendered by the common DataTable's cell switch
export function useBlogColumns({ onEdit, onDelete }: BlogColumnHandlers): DataColumn<Blog>[] {
  return [
    {
      key: "cover",
      header: "Cover",
      width: "w-20",
      type: "custom" as const,
      render: (blog: Blog) => {
        const cover = blog.images?.find((image) => image.isCover) ?? blog.images?.[0];
        return cover ? (
          <img
            src={cover.url}
            alt=""
            className="h-10 w-14 rounded-md object-cover ring-1 ring-foreground/10"
          />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        );
      }
    },
    {
      key: "title",
      header: "Title",
      type: "text",
      accessor: (blog) => blog.title,
      subAccessor: (blog) => `/${blog.slug}`
    },
    {
      key: "status",
      header: "Status",
      type: "badge",
      width: "w-24",
      accessor: (blog) => blog.status,
      capitalize: true,
      variants: { draft: "secondary", published: "default", archived: "outline" }
    },
    {
      key: "author",
      header: "Author",
      type: "text",
      muted: true,
      width: "w-44",
      accessor: (blog) => blog.author?.name ?? "—"
    },
    {
      key: "updatedAt",
      header: "Updated",
      type: "date",
      width: "w-32",
      accessor: (blog) => blog.updatedAt
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      width: "w-24",
      type: "actions",
      actions: [
        { key: "edit", icon: IconPencil, label: (blog) => `Edit ${blog.title}`, onClick: onEdit },
        {
          key: "delete",
          icon: IconTrash,
          label: (blog) => `Delete ${blog.title}`,
          onClick: onDelete,
          destructive: true
        }
      ]
    }
  ];
}

export function useBlogs() {
  // Stable fetcher: maps the generic filter values onto the blogs API params
  const fetcher = useCallback(
    async ({ page, limit, filters }: { page: number; limit: number; filters: Record<string, string> }) => {
      const status =
        filters.status && filters.status !== "all" ? (filters.status as BlogStatus) : undefined;
      const q = filters.q?.trim() || undefined;
      return blogsService.list({ page, limit, status, q });
    },
    []
  );

  const table = useDataTable<Blog>({
    fetcher,
    initialFilters: { q: "", status: "all" },
    pageSize: 10
  });

  const remove = (id: string) => table.removeItem(id, blogsService.remove);

  return { ...table, remove };
}
