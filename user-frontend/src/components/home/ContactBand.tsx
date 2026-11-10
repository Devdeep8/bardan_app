"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { WhatsAppIcon } from "@/components/home/WhatsAppIcon";

// Painted Board close: the ochre band where the wall ends — the number
// again, enormous, because this page has exactly one job: the call.
export function ContactBand({
  phone,
  phoneDisplay,
  waLink,
}: {
  phone: string;
  phoneDisplay: string;
  waLink: string;
}) {
  const { t } = useLanguage();

  return (
    <section className="bg-ochre py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 text-ink">
        <h2 className="font-paint text-4xl sm:text-6xl">{t("home.contactTitle")}</h2>
        <p className="mt-4 max-w-2xl text-xl font-semibold text-ink/80">
          {t("home.contactSub")}
        </p>
        <a
          href={`tel:${phone}`}
          className="mt-8 block font-poster text-4xl tracking-wide tabular-nums underline decoration-ink/30 underline-offset-8 hover:decoration-ink sm:text-6xl"
        >
          {phoneDisplay}
        </a>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href={`tel:${phone}`}
            className="flex min-h-14 items-center justify-center gap-3 bg-ink px-8 text-xl font-extrabold text-paper hover:bg-ember"
          >
            <Phone className="size-6" aria-hidden />
            {t("home.call")}
          </a>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-14 items-center justify-center gap-3 border-2 border-ink px-8 text-xl font-extrabold text-ink hover:bg-ink hover:text-paper"
          >
            <WhatsAppIcon className="size-6" />
            {t("home.whatsapp")}
          </a>
        </div>
      </div>
    </section>
  );
}
