import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Robots allows crawling everywhere (public marketing site); the sitemap
// reference is added only when a real domain is configured.
export default function robots(): MetadataRoute.Robots {
  if (!SITE_URL) {
    return { rules: { userAgent: "*", allow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL.replace(/\/$/, "")}/sitemap.xml`,
  };
}
