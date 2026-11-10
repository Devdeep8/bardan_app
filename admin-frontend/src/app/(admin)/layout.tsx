"use client";

// src/app/(admin)/layout.tsx
// Shell for every authenticated admin page: auth guard + sidebar + header.
// Pages in this group render inside SidebarInset.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconLoader } from "@tabler/icons-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarCustom } from "@/components/SidebarCustom";
import { Header } from "@/components/Header";
import { useAuthStore } from "@/store/auth.store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <IconLoader className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <SidebarCustom />
      <SidebarInset>
        <Header />
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
