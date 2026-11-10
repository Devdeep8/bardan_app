"use client";

// src/components/Header/index.tsx
// Top bar of the admin area: sidebar toggle (mobile) + signed-in admin + logout.
import { useRouter } from "next/navigation";
import { IconLogout } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { authStore, useAuthStore } from "@/store/auth.store";

export function Header() {
  const router = useRouter();
  const { admin } = useAuthStore();

  const handleLogout = async () => {
    await authStore.logout();
    router.replace("/login");
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />

      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {admin ? `${admin.name} · ${admin.role.replace("_", " ")}` : ""}
        </span>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <IconLogout />
          Logout
        </Button>
      </div>
    </header>
  );
}
