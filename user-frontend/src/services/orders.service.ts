// src/services/orders.service.ts
import { apiRequest } from "./api.service";

export type OrderStatus = "unpaid" | "partially_paid" | "paid";
export type MaterialType = "ret" | "gitti" | "both";
export type PaymentType = "nagad" | "udhaar" | "online";

export interface OrderCustomer {
  id: string;
  name: string;
  phone: string;
}

export interface Order {
  id: string;
  order_no: number;
  /** Business-local calendar day the order belongs to, "YYYY-MM-DD". */
  order_date: string;
  customer_id: string;
  total_amount: number;
  amount_received: number;
  /** Derived server-side from amount_received vs total_amount. */
  status: OrderStatus;
  /** Bahi-khata fields — null on pre-Phase-1 orders. */
  village: string | null;
  material: MaterialType | null;
  grade: string | null;
  quantity: number | null;
  rate: number | null;
  payment_type: PaymentType | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  customer?: OrderCustomer;
}

export interface CreateOrderPayload {
  phone: string;
  name: string;
  village: string;
  material: MaterialType;
  quantity: number;
  payment_type: PaymentType;
  grade?: string;
  rate?: number;
  note?: string;
  /** Optional — when omitted the backend computes quantity × rate. */
  total_amount?: number;
  amount_received?: number;
  /** Optional ledger day — defaults to today; past days allowed. */
  date?: string;
}

export const ordersService = {
  /** GET /api/v1/orders?date=YYYY-MM-DD — one day of orders (joined with customer) */
  listByDay: (date: string) => apiRequest<Order[]>(`/api/v1/orders?date=${date}`),

  /** GET /api/v1/orders/:id */
  getById: (id: string) => apiRequest<Order>(`/api/v1/orders/${id}`),

  /** POST /api/v1/orders — find-or-create customer by phone, then create the order */
  create: (payload: CreateOrderPayload) =>
    apiRequest<Order>("/api/v1/orders", { method: "POST", body: payload }),

  /** PATCH /api/v1/orders/:id — update amount_received; status recomputed server-side */
  updateReceived: (id: string, amount_received: number) =>
    apiRequest<Order>(`/api/v1/orders/${id}`, { method: "PATCH", body: { amount_received } }),
};
