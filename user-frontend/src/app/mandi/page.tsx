"use client";

// src/app/mandi/page.tsx — farmer home: gate-status strip + upcoming trips.
import { useEffect, useState } from "react";
import Link from "next/link";
import { mandiApi, gateLabels, fmtDate, fmtTime, type Trip, type Mandi } from "@/services/mandi.service";

export default function FarmerHome() {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [gate, setGate] = useState<{ status: string | null; confirmations: number; lastReportAt: string | null } | null>(null);
  const [mandi, setMandi] = useState<Mandi | null>(null);

  async function load() {
    const [t, ms] = await Promise.all([mandiApi.trips(), mandiApi.mandis()]);
    setTrips(t.trips);
    if (ms.mandis[0]) {
      setMandi(ms.mandis[0]);
      setGate(await mandiApi.gateStatus(ms.mandis[0].id));
    }
  }
  useEffect(() => { load().catch(() => {}); }, []);

  const gateText = gate?.status ? gateLabels[gate.status] : "हाल ही में कोई अपडेट नहीं";
  const gateColor = gate?.status === "open" ? "bg-green-600" : gate?.status === "closed" ? "bg-red-600" : gate?.status === "long_queue" ? "bg-orange-500" : "bg-gray-500";

  return (
    <div className="space-y-4">
      {mandi && (
        <div className={`${gateColor} rounded-xl px-4 py-3 text-white`}>
          <div className="text-sm">{mandi.nameHi} — गेट</div>
          <div className="text-xl font-bold">
            {gateText}
            {gate?.status && gate.confirmations > 0 && <span className="ml-2 text-sm font-normal">({gate.confirmations} पुष्टि)</span>}
          </div>
          {gate?.lastReportAt && (
            <div className="text-xs">{Math.max(1, Math.round((Date.now() - new Date(gate.lastReportAt).getTime()) / 60000))} मिनट पहले</div>
          )}
        </div>
      )}

      <h2 className="text-xl font-bold text-green-800">आने वाली ट्रिप्स</h2>
      {trips === null && <p className="text-gray-500">लोड हो रहा है…</p>}
      {trips?.length === 0 && <p className="text-gray-500">अभी कोई ट्रिप नहीं है। बाद में देखें।</p>}
      {trips?.map((t) => {
        const left = t.capacityBori - t.bookedBori;
        return (
          <Link key={t.id} href={`/mandi/trips/${t.id}`}
            className="block rounded-xl border border-green-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-green-900">{t.mandi?.nameHi}</div>
              <div className="text-sm text-gray-600">{t.vehicle?.type === "tractor" ? "🚜 ट्रैक्टर" : "🛻 टेम्पो"}</div>
            </div>
            <div className="mt-1 text-gray-700">📅 {fmtDate(t.departsAt)} · ⏰ {fmtTime(t.departsAt)}</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-semibold text-green-800">₹{t.ratePerBori} / बोरी</span>
              <span className={`font-bold ${left > 0 ? "text-green-700" : "text-red-600"}`}>
                {left > 0 ? `${left} बोरी खाली` : "भर गई"}
              </span>
            </div>
            <div className="mt-1 truncate text-sm text-gray-500">रास्ते: {t.stops?.map((s) => s.village.nameHi).join(" → ")}</div>
          </Link>
        );
      })}
      <button onClick={() => load().catch(() => {})} className="h-12 w-full rounded-xl border border-green-300 bg-white font-semibold text-green-800">
        रिफ्रेश करें
      </button>
    </div>
  );
}
