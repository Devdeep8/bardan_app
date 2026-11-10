import type { Metadata } from "next";
import { NewOrderView } from "@/views/NewOrderView";

export const metadata: Metadata = {
  title: "New Order | Patidar Stone Crusher",
  description: "Create a new customer order",
};

export default function NewOrderPage() {
  return <NewOrderView />;
}
