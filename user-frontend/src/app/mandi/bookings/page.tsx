"use client";

// src/app/mandi/bookings/page.tsx — farmer's bookings with live trip status.
import { useEffect, useState } from "react";
import Link from "next/link";
import { mandiApi, cropLabels, fmtDate, fmtTime, statusLabels, type Booking } from "@/services/mandi.service";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    mandiApi.myBookings().then((d) => setBookings(d.bookings)).catch((e) => setMsg(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-green-800">मेरी बुकिंग</h2>
      {bookings === null && <p className="text-gray-500">लोड हो रहा है…</p>}
      {bookings?.length === 0 && <p className="text-gray-500">अभी कोई बुकिंग नहीं है।</p>}
      {bookings?.map((b) => (
        <Link key={b.id} href={`/mandi/trips/${b.tripId}`}
          className="block rounded-xl border border-green-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="font-bold text-green-900">{b.trip?.mandi?.nameHi}</div>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${b.trip?.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
              {statusLabels[b.trip?.status || ""] || b.trip?.status}
            </span>
          </div>
          <div className="mt-1 text-gray-700">{b.boriCount} बोरी · {cropLabels[b.crop]}</div>
          {b.trip && <div className="text-gray-600">📅 {fmtDate(b.trip.departsAt)} · ⏰ {fmtTime(b.trip.departsAt)}</div>}
          {b.trip?.status === "active" && <div className="mt-1 font-semibold text-green-700">📍 लाइव लोकेशन देखें →</div>}
        </Link>
      ))}
      {msg && <p className="text-center text-red-700">{msg}</p>}
    </div>
  );
}
