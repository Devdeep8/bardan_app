// src/services/mandi.service.ts
// Mandi Trip API client. Self-contained fetch wrapper (no CRM refresh loop).
// Auth rides entirely in the backend-set httpOnly cookie (mandi_access_token,
// ~90 days) — no token in localStorage, no Authorization header.

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3012";
const BASE = `${API}/api/v1/mandi`;

export class MandiApiError extends Error {
  constructor(message: string, public code: string, public statusCode: number) {
    super(message);
  }
}

async function req<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload || payload.success === false) {
    throw new MandiApiError(
      payload?.errors?.message || "कुछ गड़बड़ हुई — फिर कोशिश करें",
      payload?.errors?.code || "REQUEST_FAILED",
      res.status,
    );
  }
  return payload.data as T;
}

// ---- types ----
export type Village = { id: string; nameHi: string; nameEn: string };
export type Mandi = { id: string; nameHi: string; nameEn: string };
export type User = { id: string; phone: string; name?: string; role: "farmer" | "driver"; villageId?: string };
export type Vehicle = { id: string; type: "tractor" | "tempo"; capacityBori: number; numberPlate?: string };
export type Trip = {
  id: string; departsAt: string; bookingCutoffAt: string; status: string;
  capacityBori: number; bookedBori: number; ratePerBori: number;
  driver?: { id: string; name?: string; phone: string };
  vehicle?: Vehicle; mandi?: Mandi;
  stops?: { id: string; village: Village }[];
};
export type Booking = {
  id: string; tripId: string; boriCount: number; crop: string; status: string; paymentStatus?: string;
  stop?: { village: Village };
  trip?: Trip;
};

// ---- auth ----
export const mandiApi = {
  requestOtp: (phone: string) => req<{ expirySeconds: number }>("/auth/otp/request", "POST", { phone }),
  verifyOtp: (phone: string, otp: string, meta?: { ip?: string; country?: string }) =>
    req<{ user: User }>("/auth/otp/verify", "POST", { phone, otp, ...meta }),
  firebaseLogin: (idToken: string, meta?: { ip?: string; country?: string }) =>
    req<{ user: User }>("/auth/firebase", "POST", { idToken, ...meta }),
  logout: () => req<{ loggedOut: boolean }>("/auth/otp/logout", "POST"),
  me: () => req<{ user: User }>("/me"),
  updateMe: (patch: Partial<Pick<User, "name" | "role" | "villageId">> & { villageName?: string }) =>
    req<{ user: User }>("/me", "PATCH", patch),

  villages: () => req<{ villages: Village[] }>("/villages"),
  mandis: () => req<{ mandis: Mandi[] }>("/mandis"),

  vehicles: () => req<{ vehicles: Vehicle[] }>("/vehicles"),
  createVehicle: (v: { type: "tractor" | "tempo"; capacityBori: number; numberPlate?: string }) =>
    req<{ vehicle: Vehicle }>("/vehicles", "POST", v),

  trips: (villageId?: string) => req<{ trips: Trip[] }>(`/trips${villageId ? `?villageId=${villageId}` : ""}`),
  trip: (id: string) => req<{ trip: Trip; myBooking: Booking | null }>(`/trips/${id}`),
  myTrips: () => req<{ trips: Trip[] }>("/trips/mine"),
  createTrip: (t: { vehicleId: string; mandiId: string; villageIds: string[]; departsAt: string; capacityBori: number; ratePerBori: number }) =>
    req<{ trip: Trip }>("/trips", "POST", t),
  repeatTrip: (departsAt?: string) => req<{ trip: Trip }>("/trips/repeat", "POST", departsAt ? { departsAt } : {}),
  startTrip: (id: string) => req<{ trip: Trip }>(`/trips/${id}/start`, "POST"),
  endTrip: (id: string) => req<{ trip: Trip }>(`/trips/${id}/end`, "POST"),
  cancelTrip: (id: string) => req<{ trip: Trip }>(`/trips/${id}/cancel`, "POST"),
  tripBookings: (id: string) =>
    req<{ bookings: (Booking & { farmer: { name?: string; phone: string } })[]; totals: { bookedBori: number; capacityBori: number; boriLeft: number; farmers: number } }>(`/trips/${id}/bookings`),

  book: (tripId: string, b: { villageId: string; boriCount: number; crop: string }) =>
    req<{ booking: Booking; trip: Trip }>(`/trips/${tripId}/bookings`, "POST", b),
  updateBooking: (id: string, boriCount: number) => req<{ booking: Booking }>(`/bookings/${id}`, "PATCH", { boriCount }),
  cancelBooking: (id: string) => req<{ booking: Booking }>(`/bookings/${id}/cancel`, "POST"),
  markPaid: (id: string, paymentStatus: "paid" | "unpaid") =>
    req<{ booking: Booking }>(`/bookings/${id}/payment`, "PATCH", { paymentStatus }),
  myBookings: () => req<{ bookings: Booking[] }>("/me/bookings"),

  postLocation: (tripId: string, p: { lat: number; lng: number; accuracy?: number; speed?: number }) =>
    req<{ stored: boolean }>(`/trips/${tripId}/location`, "POST", p),
  getLocation: (tripId: string) =>
    req<{ tripId: string; status: string; point: { lat: number; lng: number; recordedAt: string } | null; nearestStop: { name: string; distanceKm: number } | null; distanceToMandiKm: number | null; mandi: Mandi }>(`/trips/${tripId}/location`),

  reportGate: (mandiId: string, status: "open" | "closed" | "long_queue") =>
    req<{ report: unknown }>(`/mandis/${mandiId}/status`, "POST", { status }),
  gateStatus: (mandiId: string) =>
    req<{ status: "open" | "closed" | "long_queue" | null; confirmations: number; lastReportAt: string | null }>(`/mandis/${mandiId}/status`),
};

export const cropLabels: Record<string, string> = { soybean: "सोयाबीन", wheat: "गेहूं", garlic: "लहसुन", other: "अन्य" };
export const gateLabels: Record<string, string> = { open: "खुला है", closed: "बंद है", long_queue: "लंबी कतार" };
export const statusLabels: Record<string, string> = {
  scheduled: "निर्धारित", active: "चल रही है", completed: "पूरी हुई", cancelled: "रद्द", expired: "रद्द (शुरू नहीं हुई)",
};
export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("hi-IN", { hour: "numeric", minute: "2-digit", hour12: true });
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("hi-IN", { day: "numeric", month: "short" });

/** Fetch our own Cloudflare /cdn-cgi/trace for ip + country (no API key).
 *  Only works when the site is served through Cloudflare; skip local hosts. */
export async function fetchTraceMeta(): Promise<{ ip?: string; country?: string }> {
  const hostname = window.location.hostname;
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname === "[::1]"
  ) {
    return {};
  }

  try {
    const text = await fetch("/cdn-cgi/trace", { cache: "no-store" }).then((r) => (r.ok ? r.text() : ""));
    const entries: Record<string, string> = Object.fromEntries(
      text.split("\n").filter((l) => l.includes("=")).map((l) => l.split("=")),
    );
    return { ip: entries.ip, country: entries.loc };
  } catch {
    return {};
  }
}
