"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n";
import { SITE_NAV } from "@/lib/site";

// Painted Board footer: the strip below the last painting — ink ground,
// brand once, the door-row repeated small, staff door smaller.
export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="bg-ink py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Image
            src="/images/logo-reverse.png"
            alt={t("common.appName")}
            width={400}
            height={183}
            className="h-10 w-auto"
          />
          <Link href="/login" className="text-base font-bold text-paper/60 hover:text-ochre">
            {t("home.staffLogin")}
          </Link>
        </div>
        <p className="text-sm font-medium text-paper/50">{t("site.footerNote")}</p>
        <nav aria-label={t("site.materialNav")}>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {SITE_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-base font-semibold text-paper/70 hover:text-ochre">
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
