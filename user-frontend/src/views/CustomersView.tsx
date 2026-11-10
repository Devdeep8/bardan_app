"use client";

// src/views/CustomersView.tsx
// Khata index: every customer with their all-time order stats, paginated.
// Search matches name or phone prefix; tapping a row opens the customer's
// full order history.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Search } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { formatINR } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/Pagination";
import { customersService, type CustomersPage } from "@/services/customers.service";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

export function CustomersView() {
  const { t } = useLanguage();
  const router = useRouter();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CustomersPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Debounce the search box; a new term always restarts from page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async (targetPage: number, targetSearch: string) => {
    setLoading(true);
    setFailed(false);
    try {
      setData(await customersService.list(targetPage, PAGE_SIZE, targetSearch));
    } catch {
      setData(null);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, search);
  }, [page, search, load]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16">
      <h1 className="mt-4 text-2xl font-extrabold text-stone-900">{t("customers.title")}</h1>

      {/* Search — name or phone prefix */}
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-stone-400" />
        <Input
          type="search"
          inputMode="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("customers.searchPlaceholder")}
          aria-label={t("customers.searchPlaceholder")}
          className="pl-12"
        />
      </div>

      {/* Customer rows */}
      <div className="mt-4">
        {loading ? (
          <div className="flex min-h-40 items-center justify-center rounded-xl border-2 border-stone-200 bg-white">
            <Loader2 className="size-10 animate-spin text-stone-400" />
          </div>
        ) : failed ? (
          <div className="rounded-xl border-2 border-stone-200 bg-white p-6 text-center">
            <p className="text-lg font-semibold text-stone-700">{t("customers.loadFailed")}</p>
            <button
              type="button"
              onClick={() => load(page, search)}
              className="mt-4 min-h-12 rounded-xl border-2 border-orange-600 px-6 text-lg font-bold text-orange-700 hover:bg-orange-50"
            >
              {t("common.retry")}
            </button>
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <ul className="space-y-3">
              {data.items.map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/customers/${customer.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl border-2 border-stone-200 bg-white p-4 text-left hover:border-orange-300 active:bg-orange-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xl font-bold text-stone-900">{customer.name}</p>
                      <p className="truncate text-lg text-stone-600">{customer.phone}</p>
                      <p className="mt-1 text-base text-stone-500">
                        {t("customers.ordersCount", { count: customer.orders_count })}
                        {customer.total_pending > 0 ? (
                          <span className="ml-2 font-semibold text-red-600">
                            {t("customers.pending", { amount: formatINR(customer.total_pending) })}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <ChevronRight className="size-8 shrink-0 text-stone-400" />
                  </button>
                </li>
              ))}
            </ul>
            <Pagination
              page={page}
              totalPages={data.pagination.totalPages}
              disabled={loading}
              onChange={setPage}
            />
          </>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-stone-300 bg-white p-8 text-center">
            <p className="text-xl font-bold text-stone-700">{t("customers.noResults")}</p>
            <p className="mt-1 text-lg text-stone-500">{t("customers.noResultsHint")}</p>
            <Link
              href="/new"
              className="mt-4 inline-flex min-h-12 items-center rounded-xl border-2 border-orange-600 px-6 text-lg font-bold text-orange-700 hover:bg-orange-50"
            >
              {t("dashboard.newOrder")}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
