"use client";

// src/components/SidebarSection/index.tsx
// Renders a single nav section from common/navigation.ts:
// a direct link, or a collapsible parent (e.g. CMS) with sub-items.
// Note: this registry is Base UI — composition uses the `render` prop.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronDown } from "@tabler/icons-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar";
import type { NavSection } from "@/common/navigation";

type SidebarSectionProps = {
  section: NavSection;
};

const isItemActive = (url: string, pathname: string) =>
  pathname === url || pathname.startsWith(`${url}/`);

export function SidebarSection({ section }: SidebarSectionProps) {
  const pathname = usePathname();
  const Icon = section.icon;

  // Leaf section (e.g. Dashboard) — direct link
  if (!section.items) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          render={<Link href={section.url} />}
          isActive={isItemActive(section.url, pathname)}
          tooltip={section.title}
        >
          {Icon && <Icon />}
          <span>{section.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // Parent section (e.g. CMS) — collapsible with sub-items,
  // auto-expanded when one of its pages is active
  return (
    <Collapsible
      render={<SidebarMenuItem />}
      defaultOpen={section.items.some((item) => isItemActive(item.url, pathname))}
    >
      <CollapsibleTrigger
        render={<SidebarMenuButton tooltip={section.title} className="group/collapsible" />}
      >
        {Icon && <Icon />}
        <span>{section.title}</span>
        <IconChevronDown className="ml-auto transition-transform duration-200 group-data-[panel-open]/collapsible:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {section.items.map((item) => (
            <SidebarMenuSubItem key={item.url}>
              <SidebarMenuSubButton
                render={<Link href={item.url} />}
                isActive={isItemActive(item.url, pathname)}
              >
                <span>{item.title}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}
