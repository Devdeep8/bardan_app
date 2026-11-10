import type { Metadata } from "next";
import { OrderDetailView } from "@/views/OrderDetailView";

export const metadata: Metadata = {
  title: "Order Details | Patidar Stone Crusher",
  description: "Order details and payment update",
};

export default function OrderDetailPage() {
  return <OrderDetailView />;
}
