"use client";

// src/components/SidebarCustom/index.tsx
// The admin app sidebar: brand header, permission-filtered nav sections
// and the signed-in admin in the footer.
import { IconAnchor } from "@tabler/icons-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu
} from "@/components/ui/sidebar";
import { SidebarSection } from "@/components/SidebarSection";
import { NAV_SECTIONS, type NavSection } from "@/common/navigation";
import { hasPermission } from "@/common/permissions";
import { useAuthStore } from "@/store/auth.store";
import type { AdminRole } from "@/services/auth.service";

// Keep sections the role may see; drop parent sections whose sub-items
// all got filtered out.
const visibleSections = (role: AdminRole | null): NavSection[] =>
  NAV_SECTIONS
    .filter((section) => hasPermission(role, section.permission))
    .map((section) =>
      section.items
        ? { ...section, items: section.items.filter((item) => hasPermission(role, item.permission)) }
        : section
    )
    .filter((section) => !section.items || section.items.length > 0);

export function SidebarCustom() {
  const { admin } = useAuthStore();
  const sections = visibleSections(admin?.role ?? null);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 overflow-hidden px-2 py-1.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <IconAnchor className="size-4" />
          </span>
          <div className="truncate leading-tight group-data-[collapsible=icon]:hidden">
            <p className="font-heading text-sm font-semibold">Boat Booking</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((section) => (
                <SidebarSection key={section.title} section={section} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="truncate px-2 py-1.5 leading-tight group-data-[collapsible=icon]:hidden">
          <p className="text-sm font-medium">{admin?.name ?? "—"}</p>
          <p className="text-xs text-muted-foreground capitalize">{admin?.role?.replace("_", " ") ?? ""}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
