import type { Metadata } from "next";
import { PlantView } from "@/views/site/PlantView";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our Crushing Plant in Suwasra, Mandsaur | Patidar Stone Crusher",
  description:
    "Patidar Stone Crusher runs a stone-crushing plant at Suwasra (Mandsaur, MP) producing aggregates, M-sand, stone dust and GSB. Call +91 92325 11278.",
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL), alternates: { canonical: "/plant" } } : {}),
};

export default function Page() {
  return <PlantView />;
}
