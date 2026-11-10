import type { Metadata } from "next";
import { ExpensesView } from "@/views/ExpensesView";

export const metadata: Metadata = {
  title: "Daily Expenses | Patidar Stone Crusher",
  description: "Per-day plant expenses — diesel, operation and more",
};

export default function ExpensesPage() {
  return <ExpensesView />;
}
