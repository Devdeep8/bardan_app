import type { Metadata } from "next";
import { LoginSignup } from "@/views/LoginSignup";

export const metadata: Metadata = {
  title: "Admin Login | Boat Booking",
  description: "Sign in to the Boat Booking admin panel",
};

export default function LoginPage() {
  return <LoginSignup />;
}
