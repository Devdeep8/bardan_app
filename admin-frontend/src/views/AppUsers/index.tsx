"use client";

// src/views/AppUsers/index.tsx
// User-backend app user management page. Table/filter UI is config from the
// hook plus the common DataTable/FilterBar; this view only owns the dialogs.
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
import type { AppUser } from "@/services/users.service";
import { ApiError } from "@/services/api.service";
import { AppUserFormDialog } from "@/views/AppUsers/components/AppUserFormDialog";
import { APP_USER_FILTERS, useAppUserColumns, useAppUsers } from "@/views/AppUsers/hooks/useAppUsers";

export function AppUsers() {
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
  } = useAppUsers();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [deleting, setDeleting] = useState<AppUser | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);
  const openEdit = useCallback((user: AppUser) => {
    setEditing(user);
    setFormOpen(true);
  }, []);
  const openDelete = useCallback((user: AppUser) => {
    setDeleteError(null);
    setDeleting(user);
  }, []);
  // Deep link into the audit trail filtered to this user's actions
  const openLogs = useCallback(
    (user: AppUser) => router.push(`/system/audit-logs?actorId=${user.id}`),
    [router]
  );

  const columns = useAppUserColumns({ onEdit: openEdit, onDelete: openDelete, onViewLogs: openLogs });

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    setDeleteError(null);
    try {
      await remove(deleting.id);
      setDeleting(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Failed to delete the user");
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">App Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create accounts for the user app, activate/deactivate them and view their activity.
          </p>
        </div>
        <Button onClick={openCreate}>
          <IconPlus />
          New user
        </Button>
      </div>

      <FilterBar config={APP_USER_FILTERS} values={filters} onChange={setFilter} />

      <DataTable
        columns={columns}
        data={users}
        rowKey={(user) => user.id}
        loading={loading}
        error={error}
        onRetry={refresh}
        emptyMessage="No app users found."
        pagination={pagination}
        onPageChange={setPage}
        skeletonRows={10}
      />

      <AppUserFormDialog
        open={formOpen}
        user={editing}
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
            <DialogTitle>Delete app user</DialogTitle>
            <DialogDescription>
              &ldquo;{deleting?.name}&rdquo; will lose access to the app immediately. Their audit
              history is kept.
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
