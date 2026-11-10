"use client";

// src/views/AdminUsers/components/AdminUserFormDialog.tsx
// Create/edit dialog — the whole form is config from useAdminUserForm
// rendered by the common CommonForm (same pattern as BlogFormDialog).
import { IconLoader } from "@tabler/icons-react";
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
import { CommonForm } from "@/common/components/Form";
import type { AdminUser } from "@/services/admin-users.service";
import {
  ADMIN_USER_FORM_CONTROLS,
  useAdminUserSubmit
} from "@/views/AdminUsers/hooks/useAdminUserForm";

type AdminUserFormDialogProps = {
  open: boolean;
  /** null = create, adminUser = edit */
  adminUser: AdminUser | null;
  onClose: () => void;
  onSaved: () => void;
};

export function AdminUserFormDialog({ open, adminUser, onClose, onSaved }: AdminUserFormDialogProps) {
  const { initialValues, validationSchema, formError, handleSubmit } = useAdminUserSubmit({
    adminUser,
    onSaved
  });

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{adminUser ? `Edit ${adminUser.name}` : "New admin user"}</DialogTitle>
          <DialogDescription>
            {adminUser
              ? "Leave the password empty to keep the current one."
              : "The user can sign in with this email and password right away."}
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </div>
        )}

        {/* key forces a fresh form when switching between create/edit */}
        <CommonForm
          key={adminUser?.id ?? "new"}
          controls={ADMIN_USER_FORM_CONTROLS}
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }: { isSubmitting: boolean }) => (
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />} disabled={isSubmitting}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <IconLoader className="animate-spin" />}
                {adminUser ? "Save changes" : "Create user"}
              </Button>
            </DialogFooter>
          )}
        </CommonForm>
      </DialogContent>
    </Dialog>
  );
}
