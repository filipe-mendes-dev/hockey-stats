"use client";

import { NextIntlClientProvider } from "next-intl";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { createLocalePreference } from "../../i18n/preference";
import type { PreferenceStorage } from "../../i18n/preference";
import { messages } from "../../i18n/messages";
import type {
  LanguageContextValue,
  LanguageProviderProps,
} from "./LanguageProvider.interfaces";

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getBrowserStorage(): PreferenceStorage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [preference] = useState(() =>
    createLocalePreference(getBrowserStorage()),
  );
  const locale = useSyncExternalStore(
    preference.subscribe,
    preference.getSnapshot,
    preference.getServerSnapshot,
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, select: preference.select }}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages[locale]}
        timeZone="Europe/Lisbon"
      >
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const language = useContext(LanguageContext);
  if (!language) throw new Error("LanguageProvider is required");
  return language;
}
