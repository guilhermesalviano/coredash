"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { detectLocale, LOCALE_STORAGE_KEY, translate, type Locale } from "@/lib/i18n";
import { setNewsLanguage } from "@/lib/dashboardStore";
import storage from "@/lib/storage";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt-BR");

  useEffect(() => {
    const detected = detectLocale(storage.get(LOCALE_STORAGE_KEY), navigator.language);
    setLocaleState(detected);
    document.documentElement.lang = detected;
    setNewsLanguage(detected);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.documentElement.lang = next;
    storage.set(LOCALE_STORAGE_KEY, next);
    setNewsLanguage(next);
  }, []);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: (key, vars) => translate(locale, key, vars),
  }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) {
    return {
      locale: "pt-BR",
      setLocale: () => {},
      t: (key, vars) => translate("pt-BR", key, vars),
    };
  }
  return value;
}
