"use client";

// src/views/Blogs/index.tsx
// Blogs page. Everything table-related is config from the hook + the common
// DataTable/FilterBar; this view only owns the dialogs.
import { useCallback, useState } from "react";
import { IconLoader, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { DataTable } from "@/common/components/DataTable";
import { FilterBar } from "@/common/components/FilterBar";
import type { Blog } from "@/services/blogs.service";
import { ApiError } from "@/services/api.service";
import { BlogFormDialog } from "@/views/Blogs/components/BlogFormDialog";
import { BLOG_FILTERS, useBlogColumns, useBlogs } from "@/views/Blogs/hooks/useBlogs";

export function Blogs() {
  const {
    items: blogs,
    pagination,
    loading,
    error,
    filters,
    setFilter,
    setPage,
    refresh,
    remove
  } = useBlogs();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [deleting, setDeleting] = useState<Blog | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  // Stable handlers so the column config doesn't churn on every render
  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);
  const openEdit = useCallback((blog: Blog) => {
    setEditing(blog);
    setFormOpen(true);
  }, []);
  const openDelete = useCallback((blog: Blog) => {
    setDeleteError(null);
    setDeleting(blog);
  }, []);

  const columns = useBlogColumns({ onEdit: openEdit, onDelete: openDelete });

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    setDeleteError(null);
    try {
      await remove(deleting.id);
      setDeleting(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Failed to delete the blog");
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Blogs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create, edit and publish blog posts.</p>
        </div>
        <Button onClick={openCreate}>
          <IconPlus />
          New blog
        </Button>
      </div>

      <FilterBar config={BLOG_FILTERS} values={filters} onChange={setFilter} />

      <DataTable
        columns={columns}
        data={blogs}
        rowKey={(blog) => blog.id}
        loading={loading}
        error={error}
        onRetry={refresh}
        emptyMessage="No blogs found. Create your first post."
        pagination={pagination}
        onPageChange={setPage}
        skeletonRows={10}
      />

      <BlogFormDialog
        open={formOpen}
        blog={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          refresh();
        }}
      />

      {/* Delete confirmation */}
      <Dialog
        open={!!deleting}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDeleting(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete blog</DialogTitle>
            <DialogDescription>
              &ldquo;{deleting?.title}&rdquo; will be soft-deleted. It disappears from the list but
              can be restored from the database.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {deleteError}
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />} disabled={deletingBusy}>
              Cancel
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete} disabled={deletingBusy}>
              {deletingBusy && <IconLoader className="animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
