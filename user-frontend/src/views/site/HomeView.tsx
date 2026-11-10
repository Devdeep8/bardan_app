"use client";

/*
  DIRECTION CONTRACT — Painted Board (seed key 9c7e9afa)

  THESIS: The plant's own shouting wall-painting is the website — giant
  painted रेत / गिट्टी capitals, hard color fields, one ember CALL band.
  It refuses the supplier-template hero-photo-plus-three-cards default.
  OWN-WORLD: paper ground (60), ink fields & wood-type/brush type (30),
  ember action band (10), ochre close band; print grain over all; rotated
  full-bleed bands; poster rows, never cards.
  STORY: a village buyer learns in one viewport what the plant sells,
  believes the hisab-kept transparency story, and calls.
  FIRST VIEWPORT: stacked painted रेत (ink) / गिट्टी (ember) near
  viewport-height type cropped by the frame, sub-line, then the tilted
  ember band carrying the phone number — the primary action.
  FORM: street-poster typography fused with Indian painted-board signage
  (roll challenger brand-identity-canon-scher-street-typography), assigned
  index 6 of the grounded list.
  FINISH: unreviewed and undocumented is unfinished; this build ends with
  the finish review, the verdict, and DESIGN.md.
*/

import { useLanguage } from "@/lib/i18n";
import { PLANT_PHONE, PHONE_DISPLAY, waLink } from "@/lib/site";
import { PaintedHero } from "@/components/home/PaintedHero";
import { MaterialRows } from "@/components/home/MaterialRows";
import { WhyPainted } from "@/components/home/WhyPainted";
import { ContactBand } from "@/components/home/ContactBand";

// Public marketing homepage for the crusher plant (Painted Board world).
// The software itself lives behind /login -> /dashboard (auth-guarded).
export function HomeView() {
  const { t } = useLanguage();

  return (
    <>
      <PaintedHero phone={PLANT_PHONE} phoneDisplay={PHONE_DISPLAY} waLink={waLink(t("site.waDefault"))} />
      <MaterialRows />
      <WhyPainted />
      <ContactBand phone={PLANT_PHONE} phoneDisplay={PHONE_DISPLAY} waLink={waLink(t("site.waDefault"))} />
    </>
  );
}
