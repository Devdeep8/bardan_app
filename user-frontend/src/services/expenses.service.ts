// src/services/expenses.service.ts
import { apiRequest } from "./api.service";

export type ExpenseCategory = "diesel" | "operation" | "maintenance" | "wages" | "other";

export interface Expense {
  id: string;
  /** Business-local calendar day, "YYYY-MM-DD" */
  expense_date: string;
  category: ExpenseCategory;
  amount: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DayExpenses {
  date: string;
  total: number;
  expenses: Expense[];
}

export interface CreateExpensePayload {
  category: ExpenseCategory;
  amount: number;
  note?: string;
  /** Optional — backend defaults to today (business timezone) */
  date?: string;
}

export const expensesService = {
  /** GET /api/v1/expenses?date=YYYY-MM-DD — one day's entries + total */
  listByDay: (date: string) => apiRequest<DayExpenses>(`/api/v1/expenses?date=${date}`),

  /** POST /api/v1/expenses — record one expense entry */
  create: (payload: CreateExpensePayload) =>
    apiRequest<Expense>("/api/v1/expenses", { method: "POST", body: payload }),

  /** DELETE /api/v1/expenses/:id — remove a mistyped entry */
  remove: (id: string) => apiRequest<{ id: string }>(`/api/v1/expenses/${id}`, { method: "DELETE" }),
};
