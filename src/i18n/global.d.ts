import en from "../messages/en.json";
import ptPT from "../messages/pt-PT.json";
import type { Locale as SupportedLocale } from "./locales";

declare module "next-intl" {
  interface AppConfig {
    Locale: SupportedLocale;
    Messages: typeof en | typeof ptPT;
  }
}
