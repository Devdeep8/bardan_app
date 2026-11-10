import type { Metadata } from "next";
import { DashboardView } from "@/views/DashboardView";

export const metadata: Metadata = {
  title: "Orders | Patidar Stone Crusher",
  description: "Monthly order book for the crusher plant",
};

export default function DashboardPage() {
  return <DashboardView />;
}
