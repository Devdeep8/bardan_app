import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Sitemap is emitted only once the owner picks a domain and sets
// NEXT_PUBLIC_SITE_URL — no invented URLs go into the world.
export default function sitemap(): MetadataRoute.Sitemap {
  if (!SITE_URL) return [];
  const base = SITE_URL.replace(/\/$/, "");
  const routes = ["/", "/aggregates", "/m-sand", "/stone-dust", "/gsb", "/plant", "/service-area", "/contact"];
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
  }));
}
