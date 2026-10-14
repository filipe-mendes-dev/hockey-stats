import { defaultLocale, resolveLocale } from "./locales";
import type { Locale } from "./locales";

export const localeStorageKey = "benchline.locale";

export interface PreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LocalePreference {
  getSnapshot(): Locale;
  getServerSnapshot(): Locale;
  subscribe(listener: () => void): () => void;
  select(value: unknown): void;
}

export function createLocalePreference(
  storage?: PreferenceStorage,
): LocalePreference {
  let locale = defaultLocale;
  try {
    locale = resolveLocale(storage?.getItem(localeStorageKey));
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
  const listeners = new Set<() => void>();

  function getSnapshot(): Locale {
    return locale;
  }

  function getServerSnapshot(): Locale {
    return defaultLocale;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function select(value: unknown): void {
    locale = resolveLocale(value);
    try {
      storage?.setItem(localeStorageKey, locale);
    } catch {
      // The selection remains usable for this mounted session.
    }
    listeners.forEach((listener) => listener());
  }

  return { getSnapshot, getServerSnapshot, subscribe, select };
}
