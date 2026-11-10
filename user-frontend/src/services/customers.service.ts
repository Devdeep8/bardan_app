// src/services/customers.service.ts
import { apiRequest } from "./api.service";
import type { Order } from "./orders.service";

/** Bahi-khata fields of the customer's most recent order — null when the
 * customer has no orders yet (or pre-Phase-1 data). Powers form prefill. */
export interface CustomerLastOrder {
  village: string | null;
  material: "ret" | "gitti" | "both" | null;
  grade: string | null;
  quantity: number | null;
  rate: number | null;
  payment_type: "nagad" | "udhaar" | "online" | null;
}

export interface CustomerLookup {
  name: string;
  preferred_language: "hi" | "en";
  last_order: CustomerLastOrder | null;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

/** A customer row in the khata index with all-time order stats. */
export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  preferred_language: "hi" | "en";
  orders_count: number;
  total_amount: number;
  total_pending: number;
}

export interface CustomersPage {
  items: CustomerSummary[];
  pagination: PaginationInfo;
}

export interface CustomerOrdersPage {
  customer: {
    id: string;
    name: string;
    phone: string;
    preferred_language: "hi" | "en";
  };
  totals: {
    orders_count: number;
    total_amount: number;
    total_pending: number;
  };
  items: Order[];
  pagination: PaginationInfo;
}

export const customersService = {
  /**
   * GET /api/v1/customers/lookup?phone=XXXX — autofill helper for the order
   * form. Returns null when the phone is not a known customer (404).
   */
  lookupByPhone: async (phone: string): Promise<CustomerLookup | null> => {
    try {
      return await apiRequest<CustomerLookup>(
        `/api/v1/customers/lookup?phone=${encodeURIComponent(phone)}`
      );
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "NOT_FOUND" || code === "REQUEST_FAILED") return null;
      throw error;
    }
  },

  /** GET /api/v1/customers?page=&limit=&search= — paginated khata index */
  list: (page: number, limit = 20, search = "") => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search.trim()) params.set("search", search.trim());
    return apiRequest<CustomersPage>(`/api/v1/customers?${params.toString()}`);
  },

  /** GET /api/v1/customers/:id/orders?page=&limit= — one customer's history */
  listOrders: (id: string, page: number, limit = 10) =>
    apiRequest<CustomerOrdersPage>(
      `/api/v1/customers/${id}/orders?page=${page}&limit=${limit}`
    ),
};
