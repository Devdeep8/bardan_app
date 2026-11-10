import type { Metadata } from "next";
import { LoginView } from "@/views/LoginView";

export const metadata: Metadata = {
  title: "Sign In | Patidar Stone Crusher",
  description: "Sign in to manage crusher plant orders",
};

export default function LoginPage() {
  return <LoginView />;
}
