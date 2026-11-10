"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/i18n";
import { PLANT_PHONE, PHONE_DISPLAY, waLink } from "@/lib/site";
import { ContactBand } from "@/components/home/ContactBand";

// Painted Board plant page: the wall of the workshop — representative
// material photographs (honestly captioned) above ruled photo-slots that
// wait for the plant's own pictures. No fake realism, no invented claims.
export function PlantView() {
  const { t } = useLanguage();

  const gallery = [
    {
      src: "https://images.unsplash.com/photo-1671366673878-7a949e358614?auto=format&fit=crop&w=1200&q=70",
      alt: t("site.imgAggPile"),
    },
    {
      src: "https://images.unsplash.com/photo-1742887218431-60f1735abb26?auto=format&fit=crop&w=1200&q=70",
      alt: t("site.imgAggPiles"),
    },
    {
      src: "https://images.unsplash.com/photo-1540899150402-191c356d07ef?auto=format&fit=crop&w=1200&q=70",
      alt: t("site.imgGravel"),
    },
    {
      src: "https://images.unsplash.com/photo-1693854550769-36cbae7dda53?auto=format&fit=crop&w=1200&q=70",
      alt: t("site.imgGravelField"),
    },
  ];

  const slots = [
    { label: t("site.plantSlot1") },
    { label: t("site.plantSlot2") },
    { label: t("site.plantSlot3") },
  ];

  const steps = [
    { n: "1", label: t("site.plantStep1") },
    { n: "2", label: t("site.plantStep2") },
    { n: "3", label: t("site.plantStep3") },
  ];

  return (
    <>
      <section className="bg-paper pt-10 pb-6">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h1 className="mt-3 font-paint text-5xl leading-none text-ink sm:text-7xl">
            {t("site.plantTitle")}
          </h1>
          <p className="mt-5 max-w-2xl text-xl font-semibold leading-relaxed text-ink/80 sm:text-2xl">
            {t("site.plantSub")}
          </p>
        </div>
      </section>

      {/* honest gallery: representative stock, captioned as such */}
      <section className="bg-paper py-8">
        <div className="mx-auto w-full max-w-6xl px-4">
          <p className="border-t-4 border-ochre pt-3 text-base font-semibold text-ink/70">
            {t("site.plantGalleryNote")}
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {gallery.map((img) => (
              <div key={img.src} className="relative aspect-4/3 border-2 border-ink">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {/* photo slots: the frames waiting for the plant's own pictures */}
          <h2 className="mt-16 font-paint text-3xl text-ink sm:text-5xl">
            {t("site.plantProcessTitle")}
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="border-t-4 border-ink pt-5">
                <p className="font-poster text-4xl text-ember tabular-nums">{step.n}</p>
                <p className="mt-3 text-lg font-semibold text-ink/80">{step.label}</p>
              </li>
            ))}
          </ul>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {slots.map((slot) => (
              <li
                key={slot.label}
                className="flex min-h-24 items-center justify-center border-2 border-dashed border-ink/40 bg-paper-warm px-4 text-center text-base font-bold text-ink/50"
              >
                {slot.label}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <ContactBand phone={PLANT_PHONE} phoneDisplay={PHONE_DISPLAY} waLink={waLink(t("site.waDefault"))} />
    </>
  );
}
