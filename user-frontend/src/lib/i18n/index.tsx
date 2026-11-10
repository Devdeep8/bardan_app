"use client";

// src/lib/i18n/index.tsx
// Minimal i18n (i18next-equivalent) with en/hi JSON dictionaries.
// The UI language is the operator's choice (header toggle, persisted in
// localStorage) — it is independent of each customer's preferred_language.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import en from "./en.json";
import hi from "./hi.json";

export type Language = "en" | "hi";

const DICTIONARIES: Record<Language, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  hi: hi as Record<string, unknown>,
};

const STORAGE_KEY = "app-language";

// UI defaults to Hindi — the primary audience — and falls back to English
// for any key missing from a dictionary.
const DEFAULT_LANGUAGE: Language = "hi";

function lookup(lang: Language, key: string): string | undefined {
  const parts = key.split(".");
  let node: unknown = DICTIONARIES[lang];
  for (const part of parts) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === "string" ? node : undefined;
}

// Some copy is a list (e.g. per-material uses) — translated as arrays,
// with the same en fallback as translate().
function lookupList(lang: Language, key: string): string[] | undefined {
  const parts = key.split(".");
  let node: unknown = DICTIONARIES[lang];
  for (const part of parts) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return Array.isArray(node) && node.every((v) => typeof v === "string")
    ? (node as string[])
    : undefined;
}

export function translateList(lang: Language, key: string): string[] {
  return lookupList(lang, key) ?? lookupList("en", key) ?? [];
}

export function translate(lang: Language, key: string, vars?: Record<string, string | number>): string {
  const template = lookup(lang, key) ?? lookup("en", key) ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`
  );
}

type LanguageContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
  t: (key) => translate(DEFAULT_LANGUAGE, key),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(DEFAULT_LANGUAGE);

  // Restore the operator's saved language after mount (avoids a
  // server/client markup mismatch on first paint).
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "hi") {
      setLangState(saved);
    }
  }, []);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t: (key, vars) => translate(lang, key, vars) }),
    [lang, setLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
