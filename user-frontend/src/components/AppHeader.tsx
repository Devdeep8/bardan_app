"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { authStore, useAuthStore } from "@/store/auth.store";

// App header: brand name, customers (khata index), UI language toggle
// (operator-facing, independent of each customer's preferred_language)
// and logout.
export function AppHeader() {
  const { t, lang, setLang } = useLanguage();
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-10 border-b-2 border-stone-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-3xl items-center gap-3 px-4 py-2">
        {/* Brand tap always returns to the orders dashboard */}
        <Link href="/dashboard" className="min-w-0 flex-1 rounded-xl focus-visible:outline-2">
          <p className="truncate text-lg font-bold text-stone-900">{t("common.appName")}</p>
          {user?.name ? <p className="truncate text-sm text-stone-500">{user.name}</p> : null}
        </Link>

        <Link
          href="/customers"
          className="flex min-h-12 shrink-0 items-center rounded-xl border-2 border-stone-300 px-4 text-lg font-bold text-stone-700 hover:bg-stone-100 active:bg-stone-200"
        >
          {t("header.customers")}
        </Link>

        <Link
          href="/expenses"
          className="flex min-h-12 shrink-0 items-center rounded-xl border-2 border-stone-300 px-4 text-lg font-bold text-stone-700 hover:bg-stone-100 active:bg-stone-200"
        >
          {t("header.expenses")}
        </Link>

        <button
          type="button"
          onClick={() => setLang(lang === "hi" ? "en" : "hi")}
          className="flex min-h-12 shrink-0 items-center rounded-xl border-2 border-orange-600 px-4 text-lg font-bold text-orange-700 hover:bg-orange-50 active:bg-orange-100"
          aria-label="Switch language"
        >
          {t("common.languageName")}
        </button>

        <button
          type="button"
          onClick={() => authStore.logout()}
          className="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-stone-300 text-stone-600 hover:bg-stone-100 active:bg-stone-200"
          aria-label={t("header.logout")}
          title={t("header.logout")}
        >
          <LogOut className="size-6" />
        </button>
      </div>
    </header>
  );
}
