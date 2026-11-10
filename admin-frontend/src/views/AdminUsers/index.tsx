"use client";

// src/views/AdminUsers/index.tsx
// Admin user management page. Table/filter UI is config from the hook plus
// the common DataTable/FilterBar; this view only owns the dialogs.
import { useCallback, useState } from "react";
import { IconLoader, IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
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
import type { AdminUser } from "@/services/admin-users.service";
import { ApiError } from "@/services/api.service";
import { AdminUserFormDialog } from "@/views/AdminUsers/components/AdminUserFormDialog";
import { ADMIN_USER_FILTERS, useAdminUserColumns, useAdminUsers } from "@/views/AdminUsers/hooks/useAdminUsers";

export function AdminUsers() {
  const router = useRouter();
  const {
    items: users,
    pagination,
    loading,
    error,
    filters,
    setFilter,
    setPage,
    refresh,
    remove
  } = useAdminUsers();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);
  const openEdit = useCallback((user: AdminUser) => {
    setEditing(user);
    setFormOpen(true);
  }, []);
  const openDelete = useCallback((user: AdminUser) => {
    setDeleteError(null);
    setDeleting(user);
  }, []);
  // Deep link into the audit trail filtered to this user's actions
  const openLogs = useCallback(
    (user: AdminUser) => router.push(`/system/audit-logs?actorId=${user.id}`),
    [router]
  );

  const columns = useAdminUserColumns({ onEdit: openEdit, onDelete: openDelete, onViewLogs: openLogs });

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    setDeleteError(null);
    try {
      await remove(deleting.id);
      setDeleting(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Failed to delete the admin user");
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Admin Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create system users, manage their roles and jump to their activity.
          </p>
        </div>
        <Button onClick={openCreate}>
          <IconPlus />
          New user
        </Button>
      </div>

      <FilterBar config={ADMIN_USER_FILTERS} values={filters} onChange={setFilter} />

      <DataTable
        columns={columns}
        data={users}
        rowKey={(user) => user.id}
        loading={loading}
        error={error}
        onRetry={refresh}
        emptyMessage="No admin users found."
        pagination={pagination}
        onPageChange={setPage}
        skeletonRows={10}
      />

      <AdminUserFormDialog
        open={formOpen}
        adminUser={editing}
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
            <DialogTitle>Delete admin user</DialogTitle>
            <DialogDescription>
              &ldquo;{deleting?.name}&rdquo; will lose access immediately. Their audit history is
              kept.
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
