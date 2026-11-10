import type { Metadata } from "next";
import { MaterialPage } from "@/components/site/MaterialPage";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "GSB (Granular Sub-Base) Supplier in Suwasra | Patidar Stone Crusher",
  description:
    "Granular sub-base (GSB) material for road and hardstanding work from Patidar Stone Crusher, Suwasra (Mandsaur, MP). Tell us your specification. Call +91 92325 11278.",
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL), alternates: { canonical: "/gsb" } } : {}),
};

export default function Page() {
  return <MaterialPage id="gsb" />;
}
