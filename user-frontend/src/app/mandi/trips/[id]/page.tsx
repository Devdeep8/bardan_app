"use client";

// src/app/mandi/trips/[id]/page.tsx — trip detail: bori stepper, crop, booking,
// and live location while the trip is active.
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { mandiApi, cropLabels, fmtDate, fmtTime, statusLabels, type Trip, type Booking } from "@/services/mandi.service";

type LocData = Awaited<ReturnType<typeof mandiApi.getLocation>>;

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [myBooking, setMyBooking] = useState<Booking | null>(null);
  const [bori, setBori] = useState(1);
  const [crop, setCrop] = useState("soybean");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loc, setLoc] = useState<LocData | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const d = await mandiApi.trip(id);
    setTrip(d.trip); setMyBooking(d.myBooking);
    if (d.myBooking) setBori(d.myBooking.boriCount);
  }, [id]);

  useEffect(() => { load().catch((e) => setMsg(e.message)); }, [load]);

  // poll live location while the trip is active
  useEffect(() => {
    const poll = async () => {
      try {
        const l = await mandiApi.getLocation(id);
        setLoc(l);
        if (l.status !== "active" && pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; load().catch(() => {}); }
      } catch { /* not booked yet / not active */ }
    };
    poll().catch(() => {});
    pollRef.current = setInterval(poll, 20000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id, load]);

  async function book() {
    if (!trip) return;
    setBusy(true); setMsg("");
    try {
      const villageId = myBooking?.stop?.village.id || trip.stops?.[0]?.village.id;
      const d = await mandiApi.book(id, { villageId: villageId!, boriCount: bori, crop });
      setMyBooking(d.booking); setMsg("✅ बुक हो गया");
    } catch (e: any) { setMsg(e.message); }
    finally { setBusy(false); load().catch(() => {}); }
  }

  async function editBooking() {
    if (!myBooking) return;
    setBusy(true); setMsg("");
    try { await mandiApi.updateBooking(myBooking.id, bori); setMsg("✅ बुकिंग बदल गई"); }
    catch (e: any) { setMsg(e.message); }
    finally { setBusy(false); load().catch(() => {}); }
  }

  async function cancelBooking() {
    if (!myBooking) return;
    setBusy(true); setMsg("");
    try { await mandiApi.cancelBooking(myBooking.id); setMyBooking(null); setMsg("बुकिंग रद्द कर दी गई"); }
    catch (e: any) { setMsg(e.message); }
    finally { setBusy(false); load().catch(() => {}); }
  }

  if (!trip) return <p className="text-gray-500">{msg || "लोड हो रहा है…"}</p>;

  const left = trip.capacityBori - trip.bookedBori;
  const isActive = trip.status === "active";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-green-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-900">{trip.mandi?.nameHi}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
            {statusLabels[trip.status] || trip.status}
          </span>
        </div>
        <div className="mt-2 text-gray-700">📅 {fmtDate(trip.departsAt)} · ⏰ {fmtTime(trip.departsAt)}</div>
        <div className="text-gray-700">₹{trip.ratePerBori} / बोरी · {left} बोरी खाली</div>
        {trip.driver && (
          <a href={`tel:${trip.driver.phone}`} className="mt-2 inline-block rounded-xl bg-green-100 px-4 py-3 font-semibold text-green-800">
            📞 {trip.driver.name || "ड्राइवर"} ({trip.driver.phone})
          </a>
        )}
      </div>

      {/* live location: text first */}
      {isActive && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="font-bold text-blue-900">📍 लाइव लोकेशन</div>
          {loc?.point ? (
            <>
              <div className="mt-1 text-lg text-blue-900">
                {loc.distanceToMandiKm != null && <>मंडी से {loc.distanceToMandiKm} किमी</>}
                {loc.nearestStop && <> · {loc.nearestStop.name} के पास</>}
              </div>
              <div className="text-xs text-blue-700">
                {Math.max(1, Math.round((Date.now() - new Date(loc.point.recordedAt).getTime()) / 60000))} मिनट पहले अपडेट
              </div>
            </>
          ) : (
            <p className="mt-1 text-blue-800">लोकेशन अभी उपलब्ध नहीं — ड्राइवर ट्रैकिंग शुरू करेगा।</p>
          )}
        </div>
      )}

      {myBooking ? (
        <div className="rounded-xl border border-green-300 bg-white p-4">
          <div className="font-bold text-green-800">✅ आपकी बुकिंग: {myBooking.boriCount} बोरी ({cropLabels[myBooking.crop]})</div>
          <div className="mt-2 text-sm text-gray-500">बुकिंग बदलना या रद्द करना केवल कट-ऑफ ({fmtTime(trip.bookingCutoffAt)}) तक।</div>
          <Stepper value={bori} max={Math.min(left + myBooking.boriCount, trip.capacityBori)} onChange={setBori} />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button disabled={busy} onClick={editBooking} className="h-14 rounded-xl bg-green-700 font-bold text-white">बदलें</button>
            <button disabled={busy} onClick={cancelBooking} className="h-14 rounded-xl border-2 border-red-500 font-bold text-red-600">रद्द करें</button>
          </div>
        </div>
      ) : trip.status === "scheduled" && new Date() < new Date(trip.bookingCutoffAt) ? (
        <div className="rounded-xl border border-green-200 bg-white p-4">
          <div className="mb-2 font-bold text-green-800">कितनी बोरी?</div>
          <Stepper value={bori} max={left} onChange={setBori} />
          <div className="mt-3 mb-2 font-bold text-green-800">फसल</div>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(cropLabels).map(([k, label]) => (
              <button key={k} onClick={() => setCrop(k)}
                className={`h-14 rounded-xl text-sm font-semibold ${crop === k ? "bg-green-700 text-white" : "border border-green-300 text-green-800"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3 text-lg font-semibold text-green-900">कुल: ₹{bori * trip.ratePerBori}</div>
          <button disabled={busy || left <= 0} onClick={book} className="mt-2 h-14 w-full rounded-xl bg-green-700 text-lg font-bold text-white disabled:opacity-50">
            बुक करें
          </button>
        </div>
      ) : (
        <p className="text-center text-gray-500">बुकिंग बंद है ({statusLabels[trip.status]}).</p>
      )}

      {msg && <p className="text-center font-semibold text-red-700">{msg}</p>}
    </div>
  );
}

function Stepper({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  const btn = "h-14 w-14 rounded-xl bg-green-100 text-3xl font-bold text-green-800 disabled:opacity-40";
  return (
    <div className="flex items-center justify-center gap-6">
      <button className={btn} disabled={value <= 1} onClick={() => onChange(value - 1)}>−</button>
      <span className="min-w-16 text-center text-3xl font-bold text-green-900">{value}</span>
      <button className={btn} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}
