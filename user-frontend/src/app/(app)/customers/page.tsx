import type { Metadata } from "next";
import { CustomersView } from "@/views/CustomersView";

export const metadata: Metadata = {
  title: "Customers | Patidar Stone Crusher",
  description: "Customer list with order stats",
};

export default function CustomersPage() {
  return <CustomersView />;
}
