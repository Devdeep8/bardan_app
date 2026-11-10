"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { useLanguage, translateList } from "@/lib/i18n";
import { PLANT_PHONE, PHONE_DISPLAY, waLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/home/WhatsAppIcon";

// Painted Board material page: the material's name painted huge on the
// paper wall, then the ledger — sizes, uses, what to tell us, collection —
// as ruled rows, and the ember band carrying the number. No cards.

type MaterialId = "aggregates" | "msand" | "stoneDust" | "gsb";

const OTHERS: Record<MaterialId, { href: string; key: string }[]> = {
  aggregates: [
    { href: "/m-sand", key: "site.msandTitle" },
    { href: "/stone-dust", key: "site.dustTitle" },
    { href: "/gsb", key: "site.gsbTitle" },
  ],
  msand: [
    { href: "/aggregates", key: "site.aggTitle" },
    { href: "/stone-dust", key: "site.dustTitle" },
    { href: "/gsb", key: "site.gsbTitle" },
  ],
  stoneDust: [
    { href: "/aggregates", key: "site.aggTitle" },
    { href: "/m-sand", key: "site.msandTitle" },
    { href: "/gsb", key: "site.gsbTitle" },
  ],
  gsb: [
    { href: "/aggregates", key: "site.aggTitle" },
    { href: "/m-sand", key: "site.msandTitle" },
    { href: "/stone-dust", key: "site.dustTitle" },
  ],
};

export function MaterialPage({ id }: { id: MaterialId }) {
  const { t, lang } = useLanguage();

  const titleKey = { aggregates: "site.aggTitle", msand: "site.msandTitle", stoneDust: "site.dustTitle", gsb: "site.gsbTitle" }[id];
  const descKey = { aggregates: "site.aggDesc", msand: "site.msandDesc", stoneDust: "site.dustDesc", gsb: "site.gsbDesc" }[id];
  const usesKey = { aggregates: "site.aggUses", msand: "site.msandUses", stoneDust: "site.dustUses", gsb: "site.gsbUses" }[id];
  const sizesNoteKey = { aggregates: "site.sizesNote", msand: "site.msandSizes", stoneDust: "site.dustSizes", gsb: "site.gsbSizes" }[id];
  // Owner-reported aggregate sizes — confirm on the phone, as the note says.
  const aggSizes = ["6 mm", "10 mm", "12 mm", "20 mm", "40 mm"];

  return (
    <>
      {/* the material's name, painted as big as the wall allows */}
      <section className="bg-paper pt-10 pb-6">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h1 className="mt-3 font-paint text-5xl leading-none text-ink sm:text-7xl">
            {t(titleKey)}
          </h1>
          <p className="mt-5 max-w-2xl text-xl font-semibold leading-relaxed text-ink/80 sm:text-2xl">
            {t(descKey)}
          </p>
        </div>
      </section>

      {/* the tilted ember band: the number, always within reach */}
      <div className="overflow-hidden">
      <div className="relative mx-[-100%] w-[300%] bg-ember py-4 poster-tilt">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-3 px-8 sm:flex-row sm:items-center sm:justify-between">
          <a
            href={`tel:${PLANT_PHONE}`}
            className="flex items-center gap-3 font-poster text-2xl tracking-wide text-paper hover:underline sm:text-3xl"
          >
            <Phone className="size-6 shrink-0" aria-hidden />
            <span className="tabular-nums">{PHONE_DISPLAY}</span>
          </a>
          <span className="font-poster text-lg uppercase tracking-[0.2em] text-paper/90">
            {t("site.cta.callForRate")}
          </span>
        </div>
      </div>
      </div>

      {/* the ledger: sizes, uses, what to tell us, collection */}
      <section className="bg-paper py-14 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h2 className="font-paint text-3xl text-ink sm:text-5xl">{t("site.sizesTitle")}</h2>
          {id === "aggregates" ? (
            <ul className="mt-8 flex flex-wrap gap-3">
              {aggSizes.map((s) => (
                <li
                  key={s}
                  className="border-2 border-ink px-5 py-2 font-poster text-2xl tabular-nums text-ink"
                >
                  {s}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed text-ink/70">
            {t(sizesNoteKey)}
          </p>

          <h2 className="mt-16 font-paint text-3xl text-ink sm:text-5xl">{t("site.usesTitle")}</h2>
          <ul className="mt-8 max-w-2xl divide-y-2 divide-ink/15 border-y-2 border-ink/15">
            {translateList(lang, usesKey).map((use) => (
              <li key={use} className="py-4 text-lg font-semibold text-ink/80">
                {use}
              </li>
            ))}
          </ul>

          <div className="mt-16 grid gap-12 sm:grid-cols-2">
            <div>
              <h2 className="font-paint text-3xl text-ink sm:text-4xl">{t("site.quoteTitle")}</h2>
              <ul className="mt-6 space-y-3 text-lg font-medium text-ink/80">
                <li>· {t("site.quote1")}</li>
                <li>· {t("site.quote2")}</li>
                <li>· {t("site.quote3")}</li>
                <li>· {t("site.quote4")}</li>
              </ul>
            </div>
            <div>
              <h2 className="font-paint text-3xl text-ink sm:text-4xl">{t("site.collectionTitle")}</h2>
              <p className="mt-6 text-lg font-medium leading-relaxed text-ink/80">
                {t("site.collectionDesc")}
              </p>
            </div>
          </div>

          {/* the call + WhatsApp doors, before the ledger closes */}
          <div className="mt-14 flex flex-col gap-4 sm:flex-row">
            <a
              href={`tel:${PLANT_PHONE}`}
              className="flex min-h-14 items-center justify-center gap-3 bg-ink px-8 text-xl font-extrabold text-paper hover:bg-ember"
            >
              <Phone className="size-6" aria-hidden />
              {t("home.call")}
            </a>
            <a
              href={waLink(t("site.waDefault"))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-14 items-center justify-center gap-3 border-2 border-ink px-8 text-xl font-extrabold text-ink hover:bg-ink hover:text-paper"
            >
              <WhatsAppIcon className="size-6" />
              {t("home.whatsapp")}
            </a>
          </div>

          {/* other materials: the rest of the shutter list, one tap away */}
          <ul className="mt-16 flex flex-wrap gap-3">
            {OTHERS[id].map((o) => (
              <li key={o.href}>
                <Link
                  href={o.href}
                  className="inline-flex min-h-11 items-center border-2 border-ink px-4 text-base font-bold text-ink hover:bg-ink hover:text-paper"
                >
                  {t(o.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
