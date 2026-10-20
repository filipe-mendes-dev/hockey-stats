import type { ReactNode } from "react";
import type { Locale } from "../../i18n/locales";

export interface LanguageContextValue {
  locale: Locale;
  select(value: unknown): void;
}

export interface LanguageProviderProps {
  children: ReactNode;
}
