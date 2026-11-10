// src/services/uploads.service.ts
// File uploads go through the admin backend (which validates size/type and
// forwards to Cloudinary) — the API secret never touches the browser.
import { API_BASE_URL, ApiError, getAuthToken } from "./api.service";

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export const uploadsService = {
  /** POST /api/v1/uploads/images — multipart "file" field */
  async image(file: File): Promise<UploadedImage> {
    const headers: Record<string, string> = {};
    const accessToken = getAuthToken();
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/v1/uploads/images`, {
        method: "POST",
        headers,
        credentials: "include",
        body: (() => {
          const form = new FormData();
          form.append("file", file);
          return form;
        })()
      });
    } catch {
      throw new ApiError("Unable to reach the server. Please check your connection.", "NETWORK_ERROR");
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      const error = payload?.errors;
      throw new ApiError(
        error?.message || `Upload failed (${response.status})`,
        error?.code || "UPLOAD_FAILED",
        error?.statusCode || response.status
      );
    }
    return payload.data as UploadedImage;
  }
};
