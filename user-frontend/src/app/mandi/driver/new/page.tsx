"use client";

// src/app/mandi/driver/new/page.tsx — create trip (or repeat last in one tap);
// first run also sets up the vehicle here.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mandiApi, type Mandi, type Village, type Vehicle } from "@/services/mandi.service";

export default function NewTripPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [mandis, setMandis] = useState<Mandi[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // vehicle form (first run)
  const [vType, setVType] = useState<"tractor" | "tempo">("tractor");
  const [vCap, setVCap] = useState(100);
  const [plate, setPlate] = useState("");

  // trip form
  const [mandiId, setMandiId] = useState("");
  const [villageIds, setVillageIds] = useState<string[]>([]);
  const [when, setWhen] = useState<"today" | "tomorrow">("tomorrow");
  const [hour, setHour] = useState(6);
  const [capacity, setCapacity] = useState(100);
  const [rate, setRate] = useState(15);

  useEffect(() => {
    (async () => {
      const [v, m, vs] = await Promise.all([mandiApi.vehicles(), mandiApi.mandis(), mandiApi.villages()]);
      setVehicles(v.vehicles); setMandis(m.mandis); setVillages(vs.villages);
      if (m.mandis[0]) setMandiId(m.mandis[0].id);
      if (v.vehicles[0]) setCapacity(v.vehicles[0].capacityBori);
    })().catch((e) => setMsg(e.message));
  }, []);

  const departsAt = () => {
    const d = new Date();
    d.setDate(d.getDate() + (when === "tomorrow" ? 1 : 0));
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  async function saveVehicle() {
    setBusy(true); setMsg("");
    try {
      const d = await mandiApi.createVehicle({ type: vType, capacityBori: vCap, numberPlate: plate || undefined });
      setVehicles([...(vehicles || []), d.vehicle]);
      setCapacity(d.vehicle.capacityBori);
    } catch (e: any) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  async function create() {
    if (!villageIds.length) { setMsg("कम से कम एक गांव चुनें"); return; }
    setBusy(true); setMsg("");
    try {
      const d = await mandiApi.createTrip({
        vehicleId: vehicles![0].id, mandiId, villageIds,
        departsAt: departsAt(), capacityBori: capacity, ratePerBori: rate,
      });
      if (!d.trip?.id) throw new Error("ट्रिप बन गई, लेकिन ट्रिप की जानकारी नहीं मिली");
      router.replace(`/mandi/driver/trips/${d.trip.id}?created=1`);
    } catch (e: any) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  async function repeat() {
    setBusy(true); setMsg("");
    try {
      const d = await mandiApi.repeatTrip();
      router.replace(`/mandi/driver/trips/${d.trip.id}`);
    } catch (e: any) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  const chip = (on: boolean) => `h-14 rounded-xl px-4 text-base font-semibold ${on ? "bg-green-700 text-white" : "border border-green-300 bg-white text-green-800"}`;
  const bigBtn = "h-14 w-full rounded-xl bg-green-700 text-lg font-bold text-white disabled:opacity-50";
  const input = "h-14 w-full rounded-xl border border-gray-300 bg-white px-4 text-lg";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-green-800">नई ट्रिप</h2>

      {vehicles === null && <p className="text-gray-500">लोड हो रहा है…</p>}

      {/* first run: vehicle setup */}
      {vehicles?.length === 0 && (
        <div className="space-y-3 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
          <div className="font-bold text-yellow-900">पहले अपनी गाड़ी जोड़ें</div>
          <div className="grid grid-cols-2 gap-3">
            <button className={chip(vType === "tractor")} onClick={() => setVType("tractor")}>🚜 ट्रैक्टर</button>
            <button className={chip(vType === "tempo")} onClick={() => setVType("tempo")}>🛻 टेम्पो</button>
          </div>
          <input className={input} type="number" value={vCap} onChange={(e) => setVCap(Number(e.target.value))} placeholder="कितनी बोरी आती हैं" />
          <input className={input} value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="नंबर प्लेट (ज़रूरी नहीं)" />
          <button className={bigBtn} disabled={busy || vCap < 1} onClick={saveVehicle}>गाड़ी सेव करें</button>
        </div>
      )}

      {/* one-tap repeat */}
      <button className="h-14 w-full rounded-xl border-2 border-dashed border-green-500 font-bold text-green-700 disabled:opacity-50"
        disabled={busy || !vehicles?.length} onClick={repeat}>
        🔁 पिछली ट्रिप दोहराएँ (कल उसी समय)
      </button>

      {/* trip form */}
      {vehicles?.length ? (
        <div className="space-y-4">
          <div>
            <div className="mb-2 font-semibold">कौन सी मंडी?</div>
            <div className="grid grid-cols-2 gap-3">
              {mandis.map((m) => (
                <button key={m.id} className={chip(mandiId === m.id)} onClick={() => setMandiId(m.id)}>{m.nameHi}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 font-semibold">किन गांवों से आएंगे?</div>
            <div className="grid grid-cols-2 gap-2">
              {villages.map((v) => (
                <button key={v.id}
                  className={chip(villageIds.includes(v.id))}
                  onClick={() => setVillageIds((s) => s.includes(v.id) ? s.filter((x) => x !== v.id) : [...s, v.id])}>
                  {v.nameHi}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 font-semibold">कब निकलेंगे?</div>
            <div className="mb-2 grid grid-cols-2 gap-3">
              <button className={chip(when === "today")} onClick={() => setWhen("today")}>आज</button>
              <button className={chip(when === "tomorrow")} onClick={() => setWhen("tomorrow")}>कल</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[4, 5, 6, 7, 8, 9, 10, 12].map((h) => (
                <button key={h} className={chip(hour === h)} onClick={() => setHour(h)}>{h} बजे</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 font-semibold">कुल बोरी क्षमता</div>
              <input className={input} type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
            </div>
            <div>
              <div className="mb-1 font-semibold">₹ प्रति बोरी</div>
              <input className={input} type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
            </div>
          </div>

          <button className={bigBtn} disabled={busy || !mandiId} onClick={create}>ट्रिप बनाएँ</button>
        </div>
      ) : null}

      {msg && <p className="text-center font-semibold text-red-700">{msg}</p>}
    </div>
  );
}
