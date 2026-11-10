"use client";

// src/views/AppUsers/components/AppUserFormDialog.tsx
// Create/edit dialog — the whole form is config from useAppUserForm
// rendered by the common CommonForm (same pattern as AdminUserFormDialog).
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
import type { AppUser } from "@/services/users.service";
import {
  APP_USER_FORM_CONTROLS,
  useAppUserSubmit
} from "@/views/AppUsers/hooks/useAppUserForm";

type AppUserFormDialogProps = {
  open: boolean;
  /** null = create, user = edit */
  user: AppUser | null;
  onClose: () => void;
  onSaved: () => void;
};

export function AppUserFormDialog({ open, user, onClose, onSaved }: AppUserFormDialogProps) {
  const { initialValues, validationSchema, formError, handleSubmit } = useAppUserSubmit({
    user,
    onSaved
  });

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{user ? `Edit ${user.name}` : "New app user"}</DialogTitle>
          <DialogDescription>
            {user
              ? "Leave the password empty to keep the current one."
              : "The user can sign in to the app with this email and password right away."}
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
          key={user?.id ?? "new"}
          controls={APP_USER_FORM_CONTROLS}
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
                {user ? "Save changes" : "Create user"}
              </Button>
            </DialogFooter>
          )}
        </CommonForm>
      </DialogContent>
    </Dialog>
  );
}
