"use client";

// src/views/OrderDetailView.tsx
// Simple order detail + payment editor: mark fully paid with one tap, or
// enter an updated received amount. Status is recomputed by the server.
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { dateLabel, formatINR } from "@/lib/format";
import { ordersService, type Order } from "@/services/orders.service";

export function OrderDetailView() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [receivedInput, setReceivedInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setFailed(false);
    try {
      const found = await ordersService.getById(id);
      setOrder(found);
      setReceivedInput(found.amount_received ? String(found.amount_received) : "");
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function updatePayment(amount: number) {
    if (!order || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await ordersService.updateReceived(order.id, amount);
      setOrder(updated);
      setReceivedInput(updated.amount_received ? String(updated.amount_received) : "");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError(t("orderDetail.errorUpdate"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-stone-100">
        <Loader2 className="size-10 animate-spin text-stone-400" />
      </main>
    );
  }

  if (failed || !order) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4">
        <div className="mt-10 rounded-2xl border-2 border-stone-200 bg-white p-8 text-center">
          <p className="text-xl font-bold text-stone-700">{t("orderDetail.notFound")}</p>
          <button
            type="button"
            onClick={() => router.replace("/dashboard")}
            className="mt-4 min-h-12 rounded-xl border-2 border-orange-600 px-6 text-lg font-bold text-orange-700 hover:bg-orange-50"
          >
            {t("common.back")}
          </button>
        </div>
      </main>
    );
  }

  const balance = Math.max(0, order.total_amount - order.amount_received);
  const fullyPaid = order.amount_received >= order.total_amount;

  // Bahi-khata rows render only when the value exists — pre-Phase-1 orders
  // have nulls there.
  const rows = [
    { label: t("orderDetail.orderNo"), value: `#${order.order_no}` },
    { label: t("orderDetail.customer"), value: order.customer?.name ?? "—" },
    { label: t("orderDetail.phone"), value: order.customer?.phone ?? "—" },
    { label: t("orderDetail.village"), value: order.village },
    { label: t("orderDetail.material"), value: order.material ? t(`material.${order.material}`) : null },
    { label: t("orderDetail.grade"), value: order.grade },
    { label: t("orderDetail.quantity"), value: order.quantity ? String(order.quantity) : null },
    { label: t("orderDetail.rate"), value: order.rate != null ? formatINR(order.rate) : null },
    {
      label: t("orderDetail.paymentType"),
      value: order.payment_type ? t(`payment.${order.payment_type}`) : null
    },
    { label: t("orderDetail.note"), value: order.note },
    // Ledger day (order_date), not the creation timestamp
    { label: t("orderDetail.date"), value: dateLabel(order.order_date ?? order.created_at, lang) },
    { label: t("orderDetail.total"), value: formatINR(order.total_amount) },
    { label: t("orderDetail.received"), value: formatINR(order.amount_received) },
    { label: t("orderDetail.balance"), value: formatINR(balance) },
  ].filter((row) => row.value != null);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16">
      <div className="mt-4 flex items-center gap-3">
        {/* Back through history so the dashboard restores the browsed day
            from its ?date= query instead of jumping to today */}
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t("common.back")}
          className="flex size-14 shrink-0 items-center justify-center rounded-xl border-2 border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
        >
          <ChevronLeft className="size-8" />
        </button>
        <h1 className="text-2xl font-extrabold text-stone-900">{t("orderDetail.title")}</h1>
      </div>

      {saved ? (
        <div
          role="status"
          className="mt-4 flex items-center gap-3 rounded-xl border-2 border-green-600 bg-green-50 p-4 text-xl font-bold text-green-700"
        >
          <CheckCircle2 className="size-8 shrink-0" />
          {t("orderDetail.updated")}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border-2 border-stone-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-3xl font-extrabold text-stone-900">#{order.order_no}</p>
          <StatusBadge status={order.status} />
        </div>

        <dl className="mt-4 divide-y divide-stone-100">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 py-3">
              <dt className="text-lg font-semibold text-stone-500">{row.label}</dt>
              <dd className="text-right text-xl font-bold text-stone-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Payment editor */}
      <div className="mt-4 space-y-4 rounded-2xl border-2 border-stone-200 bg-white p-5">
        {!fullyPaid ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => updatePayment(order.total_amount)}
            className="h-16 w-full rounded-xl bg-green-600 text-2xl font-extrabold text-white hover:bg-green-700 active:bg-green-800 disabled:opacity-60"
          >
            {t("orderDetail.markPaid")}
          </button>
        ) : null}

        <div>
          <label htmlFor="received" className="mb-1.5 block text-lg font-semibold text-stone-800">
            {t("orderDetail.editReceived")}
          </label>
          <div className="flex gap-3">
            <Input
              id="received"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={receivedInput}
              onChange={(e) => setReceivedInput(e.target.value)}
              className="flex-1"
            />
            <button
              type="button"
              disabled={saving || receivedInput === ""}
              onClick={() => updatePayment(Number(receivedInput))}
              className="min-h-14 shrink-0 rounded-xl border-2 border-orange-600 px-5 text-xl font-bold text-orange-700 hover:bg-orange-50 active:bg-orange-100 disabled:opacity-60"
            >
              {saving ? t("orderDetail.updating") : t("orderDetail.update")}
            </button>
          </div>
        </div>

        {error ? (
          <p role="alert" className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-lg font-semibold text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
