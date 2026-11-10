import type { Metadata } from "next";
import { ServiceAreaView } from "@/views/site/ServiceAreaView";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Service Area — Suwasra, Mandsaur (MP) | Patidar Stone Crusher",
  description:
    "Material is collected at our plant in Suwasra, Mandsaur district, Madhya Pradesh — buyers from Suwasra and surrounding towns arrange their own transport. Call +91 92325 11278.",
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL), alternates: { canonical: "/service-area" } } : {}),
};

export default function Page() {
  return <ServiceAreaView />;
}
