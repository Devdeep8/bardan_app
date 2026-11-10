"use client";

import { Phone } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { WhatsAppIcon } from "@/components/home/WhatsAppIcon";

// Painted Board hero: the shouting wall painting. रेत · गिट्टी stacked at
// architectural scale, cropped by the frame edge, one ember band for CALL.
// The phone number is painted on the wall, enormous — it is the offer.
export function PaintedHero({
  phone,
  phoneDisplay,
  waLink,
}: {
  phone: string;
  phoneDisplay: string;
  waLink: string;
}) {
  const { t, lang } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-paper">
      {/* giant painted words, cropped like a poster on a wall */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-4">
        <h1
          aria-label={t("home.heroTitle")}
          className="font-paint leading-[0.95] text-ink"
        >
          <span className="block text-[clamp(4.5rem,16vw,13rem)] tracking-tight">
            {lang === "hi" ? "रेत" : "SAND"}
          </span>
          <span className="block text-[clamp(4.5rem,16vw,13rem)] tracking-tight text-ember -mt-2">
            {lang === "hi" ? "गिट्टी" : "GRIT"}
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-xl font-semibold leading-relaxed text-ink/80 sm:text-2xl">
          {t("home.heroSub")}
        </p>
      </div>

      {/* the ember band: rotated off-frame, the one 10% that acts */}
      <div className="relative mx-[-100%] w-[300%] bg-ember py-5 poster-tilt">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-8 sm:flex-row sm:items-center sm:justify-between">
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-3 font-poster text-3xl tracking-wide text-paper hover:underline sm:text-4xl"
          >
            <Phone className="size-8 shrink-0" aria-hidden />
            <span className="tabular-nums">{phoneDisplay}</span>
          </a>
          <span className="font-poster text-xl uppercase tracking-[0.2em] text-paper/90">
            {t("home.heroCta")}
          </span>
        </div>
      </div>

      {/* WhatsApp as the quiet second door, on paper below the band */}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-14 items-center justify-center gap-3 border-2 border-ink px-8 text-xl font-bold text-ink hover:bg-ink hover:text-paper"
        >
          <WhatsAppIcon className="size-6" />
          {t("home.heroWhatsApp")}
        </a>
      </div>
    </section>
  );
}
