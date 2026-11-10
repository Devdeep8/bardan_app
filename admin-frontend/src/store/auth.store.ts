"use client";

// src/store/auth.store.ts
// Framework-free auth store bound to React via useSyncExternalStore.
// The session itself lives in httpOnly cookies managed by the backend;
// this store only mirrors the profile in memory (nothing in localStorage).
import { useEffect, useSyncExternalStore } from "react";
import { authService, type AdminProfile, type LoginPayload } from "@/services/auth.service";
import { setAuthToken } from "@/services/api.service";

type AuthState = {
  admin: AdminProfile | null;
  authenticated: boolean;
  /** True once the auth status is known (after the /me check on mount). */
  hydrated: boolean;
};

const INITIAL_STATE: AuthState = {
  admin: null,
  authenticated: false,
  hydrated: false,
};

let state: AuthState = INITIAL_STATE;
let hydrateStarted = false;
const listeners = new Set<() => void>();

const setState = (patch: Partial<AuthState>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};

export const authStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot: () => state,

  /**
   * Resolve the auth status once on mount by calling /me with the cookie —
   * no refresh needed here. (If the access token happens to be expired,
   * apiRequest's 401 retry silently refreshes it.)
   * Until this settles, `hydrated` stays false so route guards don't
   * redirect prematurely.
   */
  hydrate() {
    if (hydrateStarted || typeof window === "undefined") return;
    hydrateStarted = true;

    authService
      .getProfile()
      .then((admin) => setState({ admin, authenticated: true, hydrated: true }))
      .catch(() => setState({ admin: null, authenticated: false, hydrated: true }));
  },

  async login(payload: LoginPayload) {
    const { admin, accessToken } = await authService.login(payload);
    setAuthToken(accessToken);
    setState({ admin, authenticated: true });
    return admin;
  },

  async logout() {
    try {
      await authService.logout(); // clears the cookies server-side
    } catch {
      // Cookie already invalid/expired — reset the local state regardless.
    }
    setAuthToken(null);
    setState({ admin: null, authenticated: false });
  },
};

/** React binding for the auth store. Re-renders on every session change. */
export function useAuthStore(): AuthState {
  const snapshot = useSyncExternalStore(authStore.subscribe, authStore.getSnapshot, authStore.getSnapshot);

  useEffect(() => {
    authStore.hydrate();
  }, []);

  return snapshot;
}
