import type { Metadata } from "next";
import { ContactView } from "@/views/site/ContactView";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & Bulk Enquiries | Patidar Stone Crusher, Suwasra",
  description:
    "Call or WhatsApp +91 92325 11278 for aggregates, M-sand, stone dust and GSB from Suwasra (Mandsaur, MP). Rates are quoted on the phone.",
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL), alternates: { canonical: "/contact" } } : {}),
};

export default function Page() {
  return <ContactView />;
}
