"use client";

// src/views/CustomerOrdersView.tsx
// One customer's khata page: all-time totals in a header card, then their
// full order history (newest first), paginated. Order rows open the
// standard order detail.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { formatINR } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { customersService, type CustomerOrdersPage } from "@/services/customers.service";

const PAGE_SIZE = 10;

export function CustomerOrdersView() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [page, setPage] = useState(1);
  const [data, setData] = useState<CustomerOrdersPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(
    async (targetPage: number) => {
      if (!id) return;
      setLoading(true);
      setFailed(false);
      try {
        setData(await customersService.listOrders(id, targetPage, PAGE_SIZE));
      } catch {
        setData(null);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    load(page);
  }, [page, load]);

  const header = (
    <div className="mt-4 flex items-center gap-3">
      <Link
        href="/customers"
        aria-label={t("common.back")}
        className="flex size-14 shrink-0 items-center justify-center rounded-xl border-2 border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
      >
        <ChevronLeft className="size-8" />
      </Link>
      <h1 className="truncate text-2xl font-extrabold text-stone-900">
        {data ? data.customer.name : t("customerOrders.title")}
      </h1>
    </div>
  );

  if (loading && !data) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pb-16">
        {header}
        <div className="mt-4 flex min-h-40 items-center justify-center rounded-xl border-2 border-stone-200 bg-white">
          <Loader2 className="size-10 animate-spin text-stone-400" />
        </div>
      </main>
    );
  }

  if (failed || !data) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pb-16">
        {header}
        <div className="mt-4 rounded-xl border-2 border-stone-200 bg-white p-6 text-center">
          <p className="text-lg font-semibold text-stone-700">{t("customerOrders.notFound")}</p>
          <button
            type="button"
            onClick={() => load(page)}
            className="mt-4 min-h-12 rounded-xl border-2 border-orange-600 px-6 text-lg font-bold text-orange-700 hover:bg-orange-50"
          >
            {t("common.retry")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16">
      {header}

      {/* Customer + all-time totals */}
      <div className="mt-4 rounded-2xl border-2 border-stone-200 bg-white p-5">
        <p className="text-lg text-stone-600">{data.customer.phone}</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <p className="text-base font-semibold text-stone-500">{t("customers.totalOrders")}</p>
            <p className="mt-1 text-2xl font-extrabold text-stone-900">{data.totals.orders_count}</p>
          </div>
          <div>
            <p className="text-base font-semibold text-stone-500">{t("customers.totalAmount")}</p>
            <p className="mt-1 text-2xl font-extrabold text-stone-900">
              {formatINR(data.totals.total_amount)}
            </p>
          </div>
          <div>
            <p className="text-base font-semibold text-stone-500">{t("customers.totalPending")}</p>
            <p
              className={`mt-1 text-2xl font-extrabold ${
                data.totals.total_pending > 0 ? "text-red-600" : "text-green-700"
              }`}
            >
              {formatINR(data.totals.total_pending)}
            </p>
          </div>
        </div>
      </div>

      {/* Order history */}
      <h2 className="mb-2 mt-6 text-xl font-bold text-stone-800">{t("customerOrders.title")}</h2>

      {loading ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border-2 border-stone-200 bg-white">
          <Loader2 className="size-10 animate-spin text-stone-400" />
        </div>
      ) : data.items.length > 0 ? (
        <>
          <ul className="space-y-3">
            {data.items.map((order) => {
              const balance = Math.max(0, order.total_amount - order.amount_received);
              const details = [
                order.material ? t(`material.${order.material}`) : null,
                order.quantity ? `×${order.quantity}` : null,
                order.village
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl border-2 border-stone-200 bg-white p-4 text-left hover:border-orange-300 active:bg-orange-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xl font-bold text-stone-900">
                        {t("dashboard.orderNo")} #{order.order_no}
                      </p>
                      {details ? <p className="truncate text-base text-stone-500">{details}</p> : null}
                      <p className="mt-1 text-2xl font-extrabold text-stone-900">
                        {formatINR(order.total_amount)}
                        {balance > 0 ? (
                          <span className="ml-2 text-base font-semibold text-red-600">
                            {t("dashboard.balance")}: {formatINR(balance)}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </button>
                </li>
              );
            })}
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
          <p className="text-xl font-bold text-stone-700">{t("customerOrders.noOrders")}</p>
        </div>
      )}
    </main>
  );
}
