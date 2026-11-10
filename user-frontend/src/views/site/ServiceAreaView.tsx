"use client";

import { MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { PLANT_PHONE, PHONE_DISPLAY } from "@/lib/site";

// Painted Board service-area page: one painted pin-drop and the plain
// truth — the plant is in Suwasra, buyers arrange transport, so the
// "area" is wherever a buyer is willing to collect from. No invented
// radius, no delivery promises.
export function ServiceAreaView() {
  const { t } = useLanguage();

  return (
    <>
      <section className="bg-paper pt-10 pb-6">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h1 className="mt-3 font-paint text-5xl leading-none text-ink sm:text-7xl">
            {t("site.areaTitle")}
          </h1>
        </div>
      </section>

      <section className="bg-ink py-14 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4">
          <MapPin className="size-14 text-ochre" aria-hidden strokeWidth={2.5} />
          <p className="mt-6 font-poster text-3xl uppercase tracking-wide text-paper sm:text-4xl">
            सुवासरा, जिला मंदसौर, मध्य प्रदेश
          </p>
          <p className="mt-6 max-w-2xl text-xl font-medium leading-relaxed text-paper/80">
            {t("site.areaSub")}
          </p>
          <p className="mt-5 max-w-2xl border-t-4 border-ochre pt-3 text-lg font-semibold text-paper/70">
            {t("site.areaNote")}
          </p>
          <p className="mt-8 max-w-2xl text-lg font-medium leading-relaxed text-paper/70">
            {t("site.collectionDesc")}
          </p>
          <a
            href={`tel:${PLANT_PHONE}`}
            className="mt-10 inline-flex min-h-14 items-center gap-3 bg-ember px-8 text-xl font-extrabold text-paper hover:bg-paper hover:text-ink"
          >
            <Phone className="size-6" aria-hidden />
            <span className="tabular-nums">{PHONE_DISPLAY}</span>
          </a>
        </div>
      </section>
    </>
  );
}
