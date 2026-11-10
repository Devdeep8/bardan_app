"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { SITE_NAV } from "@/lib/site";

// Painted Board: a slim paper bar — the brand is the painting below,
// so this bar stays quiet: brand name in ink, toggle, staff door.
// Below it, one ruled row of painted door-links to every material page.
export function SiteHeader() {
  const { t, lang, setLang } = useLanguage();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b-2 border-ink bg-paper">
      <div className="mx-auto flex min-h-14 w-full max-w-6xl items-center gap-3 px-4 py-2">
        <Link href="/" className="flex min-w-0 flex-1 items-center">
          <Image
            src="/images/logo-primary.png"
            alt={t("common.appName")}
            width={400}
            height={183}
            priority
            className="h-11 w-auto sm:h-12"
          />
        </Link>
        <button
          type="button"
          onClick={() => setLang(lang === "hi" ? "en" : "hi")}
          className="flex min-h-10 shrink-0 items-center border-2 border-ink px-3 text-base font-bold text-ink hover:bg-ink hover:text-paper"
        >
          {t("common.languageName")}
        </button>
        <Link
          href="/login"
          className="flex min-h-10 shrink-0 items-center gap-2 border-2 border-ink bg-ink px-3 text-base font-bold text-paper hover:bg-ember hover:border-ember"
        >
          <ClipboardList className="size-4" aria-hidden />
          {t("home.staffLogin")}
        </Link>
      </div>
      {/* the ruled door-row: every material one tap away, on every page */}
      <nav aria-label={t("site.materialNav")} className="border-t-2 border-ink/20">
        <ul className="mx-auto flex w-full max-w-6xl items-stretch gap-0 overflow-x-auto px-2">
          {SITE_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center border-b-4 px-3 text-base font-bold whitespace-nowrap ${
                    active
                      ? "border-ember text-ember"
                      : "border-transparent text-ink/80 hover:text-ink hover:border-ink"
                  }`}
                >
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
