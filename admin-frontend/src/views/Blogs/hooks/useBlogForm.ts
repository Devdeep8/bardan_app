"use client";

// src/views/Blogs/hooks/useBlogForm.ts
// Blog create/edit = form controls config + validation schema + submit glue.
// Field rendering and validation live in the common CommonForm/useForm.
import { useMemo, useState } from "react";
import { blogsService, type Blog, type BlogStatus } from "@/services/blogs.service";
import { ApiError } from "@/services/api.service";
import type { FormControlConfig } from "@/common/components/Form";
import type { ValidationSchema } from "@/common/components/Form/hooks/useForm";
import { slugify } from "@/common/utils/slugify";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" }
];

// CommonForm renders these — add a field here and it appears in the dialog
export const BLOG_FORM_CONTROLS: FormControlConfig[] = [
  {
    name: "title",
    type: "input",
    label: "Title",
    placeholder: "My first blog post",
    grid: { md: 7 }
  },
  {
    name: "status",
    type: "select",
    label: "Status",
    options: STATUS_OPTIONS,
    grid: { md: 5 }
  },
  {
    name: "slug",
    type: "input",
    label: "Slug",
    placeholder: "my-first-blog-post",
    hint: "Auto-generated from the title — edit to customize",
    // Fills itself while typing the title; manual edits take over
    // (clear the field to go back to automatic)
    autoFrom: { field: "title", transform: slugify },
    grid: { md: 12 }
  },
  {
    name: "excerpt",
    type: "textarea",
    label: "Excerpt",
    rows: 2,
    placeholder: "Short summary shown in listings",
    grid: { md: 12 }
  },
  {
    name: "content",
    type: "richtext",
    label: "Content",
    placeholder: "Write the post content…",
    grid: { md: 12 }
  },
  {
    name: "images",
    type: "images",
    label: "Images",
    hint: "First image is the cover — hover a tile to change or remove. Removed images are deleted from storage when you save.",
    grid: { md: 12 }
  }
];

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const BLOG_FORM_VALIDATION: ValidationSchema = {
  title: { required: "Title is required", maxLength: 200 },
  slug: {
    pattern: {
      value: SLUG_REGEX,
      message: "Lowercase letters, numbers and single dashes only (e.g. my-first-blog)"
    }
  },
  excerpt: { maxLength: 1000 }
};

type UseBlogSubmitArgs = {
  /** null = create, blog = edit */
  blog: Blog | null;
  onSaved: () => void;
};

export function useBlogSubmit({ blog, onSaved }: UseBlogSubmitArgs) {
  const [formError, setFormError] = useState<string | null>(null);

  const initialValues = useMemo(
    () => ({
      title: blog?.title ?? "",
      slug: blog?.slug ?? "",
      excerpt: blog?.excerpt ?? "",
      content: blog?.content ?? "",
      status: blog?.status ?? ("draft" as BlogStatus),
      images: blog?.images ?? []
    }),
    [blog]
  );

  const handleSubmit = async (values: Record<string, unknown>) => {
    setFormError(null);
    try {
      const images = Array.isArray(values.images)
        ? (values.images as Array<Record<string, unknown>>).map((image) => ({
            url: String(image.url ?? ""),
            publicId: (image.publicId as string | null) ?? null,
            altText: (image.altText as string | null) ?? null,
            isCover: image.isCover === true
          }))
        : [];

      const payload = {
        title: String(values.title ?? "").trim(),
        slug: String(values.slug ?? "").trim() || undefined, // backend auto-generates when empty
        excerpt: String(values.excerpt ?? "").trim() || null,
        // richtext content is HTML — send it through as-is
        content: String(values.content ?? "").trim() || null,
        status: (values.status as BlogStatus) ?? "draft",
        images
      };
      if (blog) {
        await blogsService.update(blog.id, payload);
      } else {
        await blogsService.create(payload);
      }
      onSaved();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Failed to save the blog. Please try again."
      );
    }
  };

  return { initialValues, formError, handleSubmit };
}
