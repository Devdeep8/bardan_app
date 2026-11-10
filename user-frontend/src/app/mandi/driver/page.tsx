"use client";

// src/app/mandi/driver/page.tsx — driver's trips list.
import { useEffect, useState } from "react";
import Link from "next/link";
import { mandiApi, fmtDate, fmtTime, statusLabels, type Trip } from "@/services/mandi.service";

export default function DriverTripsPage() {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    mandiApi.myTrips().then((d) => setTrips(d.trips)).catch((e) => setMsg(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-green-800">मेरी ट्रिपें</h2>
      {trips === null && <p className="text-gray-500">लोड हो रहा है…</p>}
      {trips?.length === 0 && <p className="text-gray-500">अभी कोई ट्रिप नहीं। नीचे "नई ट्रिप" दबाएँ।</p>}
      {trips?.map((t) => (
        <Link key={t.id} href={`/mandi/driver/trips/${t.id}`}
          className="block rounded-xl border border-green-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="font-bold text-green-900">{t.mandi?.nameHi}</div>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
              t.status === "active" ? "bg-green-100 text-green-800" :
              t.status === "scheduled" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-700"}`}>
              {statusLabels[t.status]}
            </span>
          </div>
          <div className="mt-1 text-gray-700">📅 {fmtDate(t.departsAt)} · ⏰ {fmtTime(t.departsAt)}</div>
          <div className="text-gray-700">{t.bookedBori}/{t.capacityBori} बोरी बुक · ₹{t.ratePerBori}/बोरी</div>
        </Link>
      ))}
      {msg && <p className="text-center text-red-700">{msg}</p>}
    </div>
  );
}
