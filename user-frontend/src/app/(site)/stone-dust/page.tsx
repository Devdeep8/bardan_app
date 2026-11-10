import type { Metadata } from "next";
import { MaterialPage } from "@/components/site/MaterialPage";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Stone Dust (Crusher Dust) in Suwasra | Patidar Stone Crusher",
  description:
    "Crusher dust (stone dust) from Patidar Stone Crusher, Suwasra (Mandsaur, MP) for filling, paver bedding and base layers. Call +91 92325 11278 for availability and rates.",
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL), alternates: { canonical: "/stone-dust" } } : {}),
};

export default function Page() {
  return <MaterialPage id="stoneDust" />;
}
