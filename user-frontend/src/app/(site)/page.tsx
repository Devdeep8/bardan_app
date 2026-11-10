import type { Metadata } from "next";
import { HomeView } from "@/views/site/HomeView";
import { SITE_URL } from "@/lib/site";

// Homepage metadata — the brand + material cluster in one title, per the
// keyword map. No canonical until the owner picks a domain.
export const metadata: Metadata = {
  title: "Stone Aggregates, M-Sand & Crusher Dust in Suwasra | Patidar Stone Crusher",
  description:
    "Patidar Stone Crusher, Suwasra (Mandsaur, MP) supplies crushed stone aggregates (gitti) in 6–40 mm, M-sand, stone dust and GSB. Call or WhatsApp +91 92325 11278 for grades and bulk enquiries.",
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL), alternates: { canonical: "/" } } : {}),
};

export default function Page() {
  return <HomeView />;
}
