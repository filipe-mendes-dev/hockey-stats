import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "./locales";
import { messages } from "./messages";

export default getRequestConfig(async () => ({
  locale: defaultLocale,
  messages: messages[defaultLocale],
  timeZone: "Europe/Lisbon",
}));
