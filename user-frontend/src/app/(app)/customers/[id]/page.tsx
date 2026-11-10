import type { Metadata } from "next";
import { CustomerOrdersView } from "@/views/CustomerOrdersView";

export const metadata: Metadata = {
  title: "Customer Orders | Patidar Stone Crusher",
  description: "One customer's order history",
};

export default function CustomerOrdersPage() {
  return <CustomerOrdersView />;
}
