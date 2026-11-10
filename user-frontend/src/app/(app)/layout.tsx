"use client";

// src/app/(app)/layout.tsx
// Shell for every authenticated page: auth guard + header with language
// toggle and logout. Unauthenticated visitors land on /login.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useAuthStore } from "@/store/auth.store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hydrated, authenticated } = useAuthStore();

  useEffect(() => {
    if (hydrated && !authenticated) {
      router.replace("/login");
    }
  }, [hydrated, authenticated, router]);

  // Hold render until the session status is known (no login-page flash)
  if (!hydrated || !authenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-stone-100 text-stone-400">
        <Loader2 className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-stone-100">
      <AppHeader />
      {children}
    </div>
  );
}
