"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

// Painted Board: the material list as postered rows on an ink field —
// each material a row of the wall painting, name big, line beneath,
// and the whole row is a door into its own page.
// Rows, not cards: the shop-shutter ledger of what the plant sells.
export function MaterialRows() {
  const { t } = useLanguage();

  const rows = [
    { href: "/aggregates", name: t("site.aggTitle"), desc: t("site.aggDesc"), field: "text-paper" },
    { href: "/m-sand", name: t("site.msandTitle"), desc: t("site.msandDesc"), field: "text-ochre" },
    { href: "/stone-dust", name: t("site.dustTitle"), desc: t("site.dustDesc"), field: "text-paper" },
    { href: "/gsb", name: t("site.gsbTitle"), desc: t("site.gsbDesc"), field: "text-ochre" },
  ];

  return (
    <section className="bg-ink py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4">
        <h2 className="font-paint text-4xl text-paper sm:text-6xl">
          {t("site.materialsTitle")}
        </h2>
        <ul className="mt-12 border-t-2 border-paper/30">
          {rows.map((row) => (
            <li key={row.href} className="border-b-2 border-paper/30">
              <Link
                href={row.href}
                className="group flex flex-col gap-2 py-8 hover:bg-paper/5 sm:flex-row sm:items-baseline sm:gap-10"
              >
                <span
                  className={`font-poster text-4xl uppercase tracking-wide group-hover:underline sm:w-72 sm:shrink-0 sm:text-5xl ${row.field}`}
                >
                  {row.name}
                </span>
                <span className="max-w-2xl text-lg font-medium leading-relaxed text-paper/80">
                  {row.desc}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
