// Shared constants for the public marketing site (Painted Board world).
// Owner-provided contact details — not independently verified.
export const PLANT_PHONE = "+919232511278"; // tel: link (no spaces)
export const PHONE_DISPLAY = "+91 92325 11278"; // painted on the wall
export const WHATSAPP_NUMBER = "919232511278"; // wa.me link (no "+")

// Canonical domain is undecided — only used when the owner sets it.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export function waLink(text: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

// Site navigation: the shop-shutter list of what a buyer needs next.
export const SITE_NAV = [
  { href: "/aggregates", key: "site.nav.aggregates" },
  { href: "/m-sand", key: "site.nav.msand" },
  { href: "/stone-dust", key: "site.nav.stoneDust" },
  { href: "/gsb", key: "site.nav.gsb" },
  { href: "/plant", key: "site.nav.plant" },
  { href: "/service-area", key: "site.nav.serviceArea" },
  { href: "/contact", key: "site.nav.contact" },
] as const;
