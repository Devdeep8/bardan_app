// src/services/blogs.service.ts
import { apiRequest } from "./api.service";

export type BlogStatus = "draft" | "published" | "archived";

export interface BlogAuthor {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface BlogImage {
  url: string;
  /** Cloudinary public id — lets the backend delete replaced assets */
  publicId?: string | null;
  altText?: string | null;
  isCover?: boolean;
  sortOrder?: number;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  images: BlogImage[];
  status: BlogStatus;
  authorId: string | null;
  author: BlogAuthor | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface BlogListResponse {
  items: Blog[];
  pagination: BlogPagination;
}

export interface BlogListParams {
  page?: number;
  limit?: number;
  status?: BlogStatus;
  q?: string;
}

/** Fields the create/edit form sends (images managed separately later) */
export interface BlogFormPayload {
  title: string;
  slug?: string;
  excerpt?: string | null;
  content?: string | null;
  status?: BlogStatus;
}

const buildQuery = (params: BlogListParams) => {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  const query = search.toString();
  return query ? `?${query}` : "";
};

export const blogsService = {
  /** GET /api/v1/blogs — paginated list with optional status filter + title search */
  list: (params: BlogListParams = {}) =>
    apiRequest<BlogListResponse>(`/api/v1/blogs${buildQuery(params)}`),

  /** GET /api/v1/blogs/:id */
  get: (id: string) => apiRequest<Blog>(`/api/v1/blogs/${id}`),

  /** POST /api/v1/blogs */
  create: (payload: BlogFormPayload) =>
    apiRequest<Blog>("/api/v1/blogs", { method: "POST", body: payload }),

  /** PUT /api/v1/blogs/:id */
  update: (id: string, payload: Partial<BlogFormPayload>) =>
    apiRequest<Blog>(`/api/v1/blogs/${id}`, { method: "PUT", body: payload }),

  /** DELETE /api/v1/blogs/:id (soft delete) */
  remove: (id: string) =>
    apiRequest<{ id: string; deleted: boolean }>(`/api/v1/blogs/${id}`, { method: "DELETE" }),
};
