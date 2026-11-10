"use client";

// src/views/Blogs/components/BlogFormDialog.tsx
// Create/edit dialog — the whole form is config from useBlogForm rendered
// by the common CommonForm (content field is the TipTap RichTextEditor).
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
import type { Blog } from "@/services/blogs.service";
import {
  BLOG_FORM_CONTROLS,
  BLOG_FORM_VALIDATION,
  useBlogSubmit
} from "@/views/Blogs/hooks/useBlogForm";

type BlogFormDialogProps = {
  open: boolean;
  /** null = create, blog = edit */
  blog: Blog | null;
  onClose: () => void;
  onSaved: () => void;
};

export function BlogFormDialog({ open, blog, onClose, onSaved }: BlogFormDialogProps) {
  const { initialValues, formError, handleSubmit } = useBlogSubmit({ blog, onSaved });

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{blog ? "Edit blog" : "New blog"}</DialogTitle>
          <DialogDescription>
            {blog
              ? "Update the post — slug stays unchanged if left as is."
              : "Only the title is required. The slug is generated from the title if left empty."}
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
          key={blog?.id ?? "new"}
          controls={BLOG_FORM_CONTROLS}
          initialValues={initialValues}
          validationSchema={BLOG_FORM_VALIDATION}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />} disabled={isSubmitting}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <IconLoader className="animate-spin" />}
                {blog ? "Save changes" : "Create blog"}
              </Button>
            </DialogFooter>
          )}
        </CommonForm>
      </DialogContent>
    </Dialog>
  );
}
