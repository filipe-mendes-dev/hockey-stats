import en from "../messages/en.json";
import ptPT from "../messages/pt-PT.json";
import type { Locale } from "./locales";

export const messages = { en, "pt-PT": ptPT } satisfies Record<
  Locale,
  typeof en | typeof ptPT
>;
