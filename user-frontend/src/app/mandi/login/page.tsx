"use client";

// src/app/mandi/login/page.tsx
// Phone → OTP → (new users) role + village + name onboarding.
// OTP delivery: Firebase Phone Auth when NEXT_PUBLIC_FIREBASE_* is set
// (free tier ~10k/month), else dev mode (code printed in backend log).
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { mandiApi, fetchTraceMeta, type User } from "@/services/mandi.service";

const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const firebaseReady = Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);

export default function MandiLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "onboard">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<"farmer" | "driver">("farmer");
  const [name, setName] = useState("");
  const [villageName, setVillageName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const bigBtn = "h-14 w-full rounded-xl bg-green-700 text-lg font-bold text-white disabled:opacity-50";
  const input = "h-14 w-full rounded-xl border border-gray-300 bg-white px-4 text-lg text-center";

  // Firebase phone-auth session (kept in a ref — not serializable state)
  const confirmationRef = useRef<{ confirm: (code: string) => Promise<{ user: { getIdToken: () => Promise<string> } }> } | null>(null);
  const recaptchaRef = useRef<{ clear: () => void } | null>(null);
  const [recaptchaDiv, setRecaptchaDiv] = useState<HTMLDivElement | null>(null);

  useEffect(() => () => { recaptchaRef.current?.clear(); }, []);

  async function sendOtp() {
    setBusy(true); setMsg("");
    try {
      if (firebaseReady) {
        // real SMS/OTP via Firebase Phone Auth (free tier)
        const { initializeApp, getApps } = await import("firebase/app");
        const { getAuth, RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");
        const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG as any);
        const auth = getAuth(app);
        auth.languageCode = "hi";
        recaptchaRef.current?.clear();
        const verifier = new RecaptchaVerifier(auth, recaptchaDiv!, { size: "invisible" });
        recaptchaRef.current = verifier as any;
        confirmationRef.current = (await signInWithPhoneNumber(auth, `+91${phone}`, verifier)) as any;
        setStep("otp"); setMsg("OTP आपके मोबाइल पर भेज दिया गया है");
      } else {
        // dev fallback: code is printed in the backend container log
        await mandiApi.requestOtp(phone);
        setStep("otp"); setMsg("OTP भेज दिया गयई (डेवलपमेंट: कोड बैकएंड लॉग में दिखता है)");
      }
    } catch (e: any) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  async function verify() {
    setBusy(true); setMsg("");
    try {
      // session lives in the backend's httpOnly cookie — nothing to store
      // ip + country come from our own Cloudflare /cdn-cgi/trace (dev: skipped)
      const trace = await fetchTraceMeta();
      let user: User;
      if (confirmationRef.current) {
        const cred = await confirmationRef.current.confirm(otp);
        // confirm() returns a UserCredential — the ID token is on cred.user
        user = (await mandiApi.firebaseLogin(await cred.user.getIdToken(), trace)).user;
      } else {
        user = (await mandiApi.verifyOtp(phone, otp, trace)).user;
      }
      const existing = user.villageId || user.name;
      if (!existing) {
        setStep("onboard");
      } else {
        router.replace(user.role === "driver" ? "/mandi/driver" : "/mandi");
      }
    } catch (e: any) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  async function finishOnboarding() {
    if (!villageName.trim()) { setMsg("गांव का नाम डालें"); return; }
    setBusy(true); setMsg("");
    try {
      const d = await mandiApi.updateMe({
        role,
        villageName: villageName.trim(),
        name: name.trim() || undefined,
      });
      router.replace(d.user.role === "driver" ? "/mandi/driver" : "/mandi");
    } catch (e: any) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-green-50 p-6">
      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold text-green-800">🌾 मंडी ट्रिप</h1>
        <p className="mb-8 text-center text-gray-600">गांव से मंडी तक, बोरी बुक करें</p>
        {/* invisible reCAPTCHA mount point required by Firebase phone auth */}
        <div ref={setRecaptchaDiv} />

        {step === "phone" && (
          <>
            <label className="mb-2 block text-lg font-semibold">मोबाइल नंबर</label>
            <input className={input} inputMode="numeric" maxLength={10} placeholder="10 अंकों का नंबर"
              value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} />
            <button className={`${bigBtn} mt-4`} disabled={phone.length !== 10 || busy} onClick={sendOtp}>
              OTP भेजें
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <label className="mb-2 block text-lg font-semibold">OTP डालें (+91 {phone})</label>
            <input className={input} inputMode="numeric" maxLength={6} placeholder="6 अंक"
              value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
            <button className={`${bigBtn} mt-4`} disabled={otp.length !== 6 || busy} onClick={verify}>
              लॉगिन करें
            </button>
          </>
        )}

        {step === "onboard" && (
          <>
            <label className="mb-2 block text-lg font-semibold">आप कौन हैं?</label>
            <div className="mb-6 grid grid-cols-2 gap-3">
              {([["farmer", "🧑‍🌾 किसान"], ["driver", "🚜 ड्राइवर"]] as const).map(([r, label]) => (
                <button key={r} onClick={() => setRole(r)}
                  className={`h-20 rounded-xl text-lg font-bold ${role === r ? "bg-green-700 text-white" : "bg-white border border-green-300 text-green-800"}`}>
                  {label}
                </button>
              ))}
            </div>
            <label className="mb-2 block text-lg font-semibold">आपका गांव</label>
            <input className={input} value={villageName} onChange={(e) => setVillageName(e.target.value)} placeholder="गांव का नाम" />
            <label className="mb-2 block text-lg font-semibold">नाम (ज़रूरी नहीं)</label>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="आपका नाम" />
            <button className={`${bigBtn} mt-4`} disabled={busy} onClick={finishOnboarding}>शुरू करें</button>
          </>
        )}

        {msg && <p className="mt-4 text-center text-red-700">{msg}</p>}
      </div>
    </div>
  );
}
