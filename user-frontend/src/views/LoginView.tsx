"use client";

// src/views/LoginView.tsx
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { authStore, useAuthStore } from "@/store/auth.store";
import { Input } from "@/components/ui/input";

export function LoginView() {
  const { t, lang, setLang } = useLanguage();
  const router = useRouter();
  const { hydrated, authenticated } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in (e.g. navigated back to /login) -> straight to orders
  useEffect(() => {
    if (hydrated && authenticated) router.replace("/dashboard");
  }, [hydrated, authenticated, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await authStore.login({ email: email.trim(), password });
      router.replace("/dashboard");
    } catch {
      setError(t("login.error"));
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-2xl border-2 border-stone-300 bg-white text-4xl">
            ⛏️
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900">{t("common.appName")}</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border-2 border-stone-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-1 text-2xl font-bold text-stone-900">{t("login.title")}</h2>
          <p className="mb-6 text-base text-stone-500">{t("login.subtitle")}</p>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-lg font-semibold text-stone-800">
                {t("login.email")}
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-lg font-semibold text-stone-800">
                {t("login.password")}
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error ? (
            <p role="alert" className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-lg font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 h-16 w-full rounded-xl bg-orange-600 text-2xl font-extrabold text-white hover:bg-orange-700 active:bg-orange-800 disabled:opacity-60"
          >
            {submitting ? t("login.submitting") : t("login.submit")}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setLang(lang === "hi" ? "en" : "hi")}
            className="min-h-12 rounded-xl border-2 border-stone-300 bg-white px-6 text-lg font-bold text-stone-700 hover:bg-stone-50"
          >
            {t("common.languageName")}
          </button>
        </div>
      </div>
    </main>
  );
}
