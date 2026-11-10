"use client";

// src/app/mandi/layout.tsx
// Mandi Trip shell: auth guard + role-aware bottom tab nav.
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { mandiApi, type User } from "@/services/mandi.service";

export default function MandiLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isLogin = pathname === "/mandi/login";

  useEffect(() => {
    if (isLogin) { setLoading(false); return; }
    mandiApi.me()
      .then((d) => setUser(d.user))
      .catch(() => router.replace("/mandi/login"))
      .finally(() => setLoading(false));
  }, [isLogin, pathname, router]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-green-50 text-green-800">लोड हो रहा है…</div>;
  }
  if (isLogin) return <>{children}</>;

  const tabs = user?.role === "driver"
    ? [ { href: "/mandi/driver", label: "मेरी ट्रिपें" }, { href: "/mandi/driver/new", label: "नई ट्रिप" } ]
    : [ { href: "/mandi", label: "ट्रिप्स" }, { href: "/mandi/bookings", label: "मेरी बुकिंग" } ];

  return (
    <div className="min-h-screen bg-green-50 pb-20">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-green-700 px-4 py-3 text-white">
        <Link href={user?.role === "driver" ? "/mandi/driver" : "/mandi"} className="text-lg font-bold">🌾 मंडी ट्रिप</Link>
        <div className="flex items-center gap-3 text-sm">
          <span>{user?.role === "driver" ? "ड्राइवर" : "किसान"}</span>
          <button
            className="rounded-lg bg-green-600 px-3 py-1.5"
            onClick={() => { mandiApi.logout().catch(() => {}); router.replace("/mandi/login"); }}
          >
            लॉगआउट
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-md p-4">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-green-200 bg-white">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`flex h-16 flex-1 items-center justify-center text-base font-semibold ${
              pathname === t.href ? "bg-green-100 text-green-800" : "text-gray-600"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
