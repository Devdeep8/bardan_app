"use client";

// src/pages/LoginSignup/index.tsx
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconAnchor } from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/views/LoginSignup/components/LoginForm";
import { useAuthStore } from "@/store/auth.store";

export function LoginSignup() {
  const router = useRouter();
  const { hydrated, authenticated } = useAuthStore();

  // Already signed in — skip the form
  useEffect(() => {
    if (hydrated && authenticated) {
      router.replace("/dashboard");
    }
  }, [hydrated, authenticated, router]);

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary-foreground/10 ring-1 ring-primary-foreground/20">
            <IconAnchor className="size-6" />
          </span>
          <div>
            <p className="font-heading text-lg leading-tight font-semibold">Boat Booking</p>
            <p className="text-sm text-primary-foreground/70">Admin Panel</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <h1 className="font-heading text-4xl leading-tight font-semibold">
            Manage your fleet, one dashboard away.
          </h1>
          <p className="text-base text-primary-foreground/80">
            Sign in to manage packages, bookings, blogs and everything in between.
          </p>
        </div>

        {/* Decorative rings */}
        <div aria-hidden className="pointer-events-none absolute -right-32 -bottom-32 size-112 rounded-full border border-primary-foreground/10" />
        <div aria-hidden className="pointer-events-none absolute -right-16 -bottom-16 size-112 rounded-full border border-primary-foreground/15" />
        <div aria-hidden className="pointer-events-none absolute -right-48 -bottom-48 size-112 rounded-full bg-primary-foreground/5" />

        <p className="relative z-10 text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Boat Booking Admin
        </p>
      </div>

      {/* Login form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <IconAnchor className="size-5" />
            </span>
            <div>
              <p className="font-heading leading-tight font-semibold">Boat Booking</p>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl">Welcome back</CardTitle>
              <CardDescription>Sign in to your admin account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Use the admin credentials provided by your administrator
          </p>
        </div>
      </div>
    </div>
  );
}
