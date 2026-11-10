"use client";

// src/app/mandi/driver/trips/[id]/page.tsx — bookings list, Start/End with
// live tracking (watchPosition → POST every 30s), gate status buttons.
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { mandiApi, cropLabels, fmtTime, statusLabels, type Trip, type Mandi } from "@/services/mandi.service";

type TripBooking = Awaited<ReturnType<typeof mandiApi.tripBookings>>;

export default function DriverTripPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [data, setData] = useState<TripBooking | null>(null);
  const [mandis, setMandis] = useState<Mandi[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [tracking, setTracking] = useState(false);
  const watchRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const [t, b] = await Promise.all([mandiApi.trip(id), mandiApi.tripBookings(id)]);
    setTrip(t.trip); setData(b);
  }, [id]);

  useEffect(() => {
    load().catch((e) => setMsg(e.message));
    mandiApi.mandis().then((m) => setMandis(m.mandis)).catch(() => {});
    return () => stopTracking();
  }, [load]);

  // --- live tracking ---
  function stopTracking() {
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    watchRef.current = null; intervalRef.current = null;
    setTracking(false);
  }

  function startTracking() {
    setTracking(true);
    // Screen Wake Lock so tracking survives a dimmed screen
    (navigator as any).wakeLock?.request?.("screen").catch(() => {});
    const send = (pos: GeolocationPosition) =>
      mandiApi.postLocation(id, {
        lat: pos.coords.latitude, lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy, speed: pos.coords.speed ?? undefined,
      }).catch(() => {});
    // poll the cached position every 30s (works even without watch events)
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(send, () => {}, { enableHighAccuracy: true });
    }, 30000);
    watchRef.current = navigator.geolocation.watchPosition(send, () => {}, { enableHighAccuracy: true });
  }

  async function startTrip() {
    setBusy(true); setMsg("");
    try {
      await mandiApi.startTrip(id);
      startTracking();
      setMsg("ट्रिप शुरू — ट्रैकिंग चालू। ट्रैकिंग सिर्फ इसी ट्रिप के दौरान चलती है।");
      await load();
    } catch (e: any) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  async function endTrip() {
    setBusy(true); setMsg("");
    try {
      await mandiApi.endTrip(id);
      stopTracking();
      await load();
      setMsg("ट्रिप पूरी हुई 🎉");
    } catch (e: any) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  async function cancelTrip() {
    setBusy(true);
    try { await mandiApi.cancelTrip(id); stopTracking(); await load(); }
    catch (e: any) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  async function reportGate(status: "open" | "closed" | "long_queue") {
    if (!mandis[0]) return;
    try { await mandiApi.reportGate(mandis[0].id, status); setMsg("गेट स्टेटस रिपोर्ट कर दिया"); }
    catch (e: any) { setMsg(e.message); }
  }

  if (!trip) return <p className="text-gray-500">{msg || "लोड हो रहा है…"}</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-green-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-900">{trip.mandi?.nameHi}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
            trip.status === "active" ? "bg-green-100 text-green-800" :
            trip.status === "scheduled" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-700"}`}>
            {statusLabels[trip.status]}
          </span>
        </div>
        <div className="text-gray-700">⏰ {fmtTime(trip.departsAt)} · ₹{trip.ratePerBori}/बोरी</div>
        {data && <div className="mt-1 font-semibold text-green-800">{data.totals.bookedBori}/{data.totals.capacityBori} बोरी बुक · {data.totals.farmers} किसान</div>}
      </div>

      {tracking && (
        <div className="rounded-xl bg-green-700 px-4 py-3 text-center font-bold text-white">
          📍 ट्रैकिंग चालू है — ऐप खुला रखें
        </div>
      )}

      {/* bookings */}
      <div className="rounded-xl border border-green-200 bg-white p-4">
        <div className="mb-2 font-bold text-green-800">बुकिंग सूची</div>
        {data?.bookings.length === 0 && <p className="text-gray-500">अभी कोई बुकिंग नहीं।</p>}
        {data?.bookings.map((b) => (
          <div key={b.id} className="border-b border-gray-100 py-3 last:border-0">
            <div className="flex items-center justify-between">
              <a href={`tel:${b.farmer.phone}`} className="font-semibold text-green-900">
                📞 {b.farmer.name || b.farmer.phone}
              </a>
              <div className="font-bold text-green-800">{b.boriCount} बोरी</div>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm text-gray-600">
              <span>{cropLabels[b.crop]} · {b.stop?.village?.nameHi}</span>
              <button
                onClick={() => mandiApi.markPaid(b.id, b.paymentStatus === "paid" ? "unpaid" : "paid").then(load).catch((e) => setMsg(e.message))}
                className={`rounded-full px-3 py-1 font-semibold ${b.paymentStatus === "paid" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-700"}`}>
                {b.paymentStatus === "paid" ? "✅ भुगतान हुआ" : "भुगतान बाकी"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* start / end / cancel */}
      {trip.status === "scheduled" && (
        <button disabled={busy} onClick={startTrip} className="h-16 w-full rounded-xl bg-green-700 text-xl font-bold text-white disabled:opacity-50">
          ▶ ट्रिप शुरू करें
        </button>
      )}
      {trip.status === "active" && (
        <button disabled={busy} onClick={endTrip} className="h-16 w-full rounded-xl bg-red-600 text-xl font-bold text-white disabled:opacity-50">
          ⏹ ट्रिप समाप्त (मंडी पहुँच गए)
        </button>
      )}
      {["scheduled", "active"].includes(trip.status) && (
        <button disabled={busy} onClick={cancelTrip} className="h-12 w-full rounded-xl border-2 border-red-400 font-semibold text-red-600">
          ट्रिप रद्द करें
        </button>
      )}

      {/* gate status */}
      {trip.status !== "scheduled" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="mb-2 font-bold text-blue-900">मंडी गेट कैसा है?</div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => reportGate("open")} className="h-14 rounded-xl bg-green-600 font-bold text-white">खुला है</button>
            <button onClick={() => reportGate("closed")} className="h-14 rounded-xl bg-red-600 font-bold text-white">बंद है</button>
            <button onClick={() => reportGate("long_queue")} className="h-14 rounded-xl bg-orange-500 font-bold text-white">लंबी कतार</button>
          </div>
        </div>
      )}

      {searchParams.get("created") === "1" && <p className="text-center font-semibold text-green-800">ट्रिप बन गई</p>}
      {msg && <p className="text-center font-semibold text-green-800">{msg}</p>}
    </div>
  );
}
