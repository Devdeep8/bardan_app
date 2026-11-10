"use client";

import { ClipboardList, Landmark, Truck } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

// Painted Board: the trust section as three shouts on the paper wall —
// brush heading + painted icon + one plain line each. The icons are
// drawn in the poster's stroke weight, in the ember ink.
export function WhyPainted() {
  const { t } = useLanguage();

  const shouts = [
    { icon: Truck, title: t("home.why1Title"), desc: t("home.why1Desc") },
    { icon: Landmark, title: t("home.why2Title"), desc: t("home.why2Desc") },
    { icon: ClipboardList, title: t("home.why3Title"), desc: t("home.why3Desc") },
  ];

  return (
    <section className="bg-paper py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4">
        <h2 className="font-paint text-4xl text-ink sm:text-6xl">
          {t("home.whyTitle")}
        </h2>
        <ul className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {shouts.map(({ icon: Icon, title, desc }) => (
            <li key={title} className="border-t-4 border-ink pt-6">
              <Icon className="size-10 text-ember" aria-hidden strokeWidth={2.5} />
              <h3 className="mt-4 text-2xl font-extrabold text-ink">{title}</h3>
              <p className="mt-3 text-lg font-medium leading-relaxed text-ink/70">
                {desc}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
