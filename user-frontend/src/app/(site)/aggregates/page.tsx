import type { Metadata } from "next";
import { MaterialPage } from "@/components/site/MaterialPage";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Aggregates (Gitti) Supplier in Suwasra — 6–40 mm | Patidar Stone Crusher",
  description:
    "Crushed stone aggregates (gitti) in 6, 10, 12, 20 and 40 mm from Patidar Stone Crusher, Suwasra (Mandsaur, MP). For concrete, foundations and road work. Call +91 92325 11278.",
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL), alternates: { canonical: "/aggregates" } } : {}),
};

export default function Page() {
  return <MaterialPage id="aggregates" />;
}
