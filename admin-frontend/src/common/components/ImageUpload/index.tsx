/* eslint-disable @next/next/no-img-element */
"use client";

// src/common/components/ImageUpload/index.tsx
// Reusable image picker: files upload through the admin backend to
// Cloudinary (5MB / jpg-png-webp enforced here and server-side).
// Preview grid with cover toggle + remove — removed images are deleted
// from Cloudinary by the backend when the parent record is saved.
import { useRef, useState } from "react";
import {
  IconLoader,
  IconPhotoPlus,
  IconStar,
  IconStarFilled,
  IconX
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { uploadsService } from "@/services/uploads.service";
import { ApiError } from "@/services/api.service";
import { cn } from "@/lib/utils";

export type EditableImage = {
  url: string;
  publicId?: string | null;
  altText?: string | null;
  isCover?: boolean;
  sortOrder?: number;
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ImageUploadProps = {
  value: EditableImage[];
  onChange: (images: EditableImage[]) => void;
  disabled?: boolean;
  error?: string;
  maxFiles?: number;
};

export function ImageUpload({
  value,
  onChange,
  disabled = false,
  error,
  maxFiles = 12
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const remaining = maxFiles - value.length;
  const busy = uploading > 0 || disabled;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadError(null);

    const picked = Array.from(files);
    const rejected: string[] = [];

    // Client-side rules (the backend enforces them again)
    const valid = picked.filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        rejected.push(`${file.name}: only JPG, PNG and WebP are allowed`);
        return false;
      }
      if (file.size > MAX_SIZE_BYTES) {
        rejected.push(`${file.name}: must be 5MB or smaller`);
        return false;
      }
      return true;
    });

    const uploadable = valid.slice(0, Math.max(remaining, 0));
    if (valid.length > uploadable.length) {
      rejected.push(`Only ${maxFiles} images allowed`);
    }
    if (rejected.length) {
      setUploadError(rejected[0]);
    }

    for (const file of uploadable) {
      setUploading((count) => count + 1);
      try {
        const uploaded = await uploadsService.image(file);
        onChange([
          ...valueRef(),
          {
            url: uploaded.url,
            publicId: uploaded.publicId,
            altText: null,
            isCover: false,
            sortOrder: valueRef().length
          }
        ]);
      } catch (err) {
        setUploadError(
          err instanceof ApiError ? err.message : `Failed to upload ${file.name}`
        );
      } finally {
        setUploading((count) => count - 1);
      }
    }

    // Allow picking the same file again after a failed attempt
    if (inputRef.current) inputRef.current.value = "";
  };

  // Uploads run sequentially; keep working from the latest value
  const valueRef = () => value;

  const removeAt = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    // Keep exactly one cover: promote the first image if the cover was removed
    if (value[index]?.isCover && !next.some((image) => image.isCover) && next.length > 0) {
      next[0] = { ...next[0], isCover: true };
    }
    onChange(next);
  };

  const setCover = (index: number) => {
    onChange(value.map((image, i) => ({ ...image, isCover: i === index })));
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        disabled={busy || remaining <= 0}
        onChange={(event) => handleFiles(event.target.files)}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={busy || remaining <= 0}
        onClick={() => inputRef.current?.click()}
      >
        {uploading > 0 ? <IconLoader className="animate-spin" /> : <IconPhotoPlus />}
        {uploading > 0
          ? `Uploading ${uploading}…`
          : remaining <= 0
            ? "Image limit reached"
            : `Add images (${value.length}/${maxFiles})`}
      </Button>

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {value.map((image, index) => (
            <div key={image.url} className="group relative">
              <img
                src={image.url}
                alt={image.altText ?? ""}
                className={cn(
                  "aspect-[4/3] w-full rounded-md object-cover ring-1 ring-foreground/10",
                  image.isCover && "ring-2 ring-primary"
                )}
              />

              {image.isCover ? (
                <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  <IconStarFilled className="size-3" />
                  Cover
                </span>
              ) : (
                <button
                  type="button"
                  aria-label="Set as cover"
                  onClick={() => setCover(index)}
                  disabled={disabled}
                  className="absolute bottom-1 left-1 rounded-md bg-background/90 p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                >
                  <IconStar className="size-3" />
                </button>
              )}

              <button
                type="button"
                aria-label="Remove image"
                onClick={() => removeAt(index)}
                disabled={disabled}
                className="absolute top-1 right-1 rounded-md bg-background/90 p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
              >
                <IconX className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {(error || uploadError) && (
        <p className="text-xs font-medium text-destructive">{error ?? uploadError}</p>
      )}
    </div>
  );
}
