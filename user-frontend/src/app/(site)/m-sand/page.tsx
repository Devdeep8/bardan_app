import type { Metadata } from "next";
import { MaterialPage } from "@/components/site/MaterialPage";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "M-Sand Supplier in Suwasra, Mandsaur | Patidar Stone Crusher",
  description:
    "Manufactured sand (M-sand) from crushed rock at Patidar Stone Crusher, Suwasra (Mandsaur, MP) — for concrete, plastering and masonry. Call +91 92325 11278 for grades and bulk rates.",
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL), alternates: { canonical: "/m-sand" } } : {}),
};

export default function Page() {
  return <MaterialPage id="msand" />;
}
