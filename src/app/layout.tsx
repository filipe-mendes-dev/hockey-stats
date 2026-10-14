import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LanguageProvider } from "../client/i18n/provider";
import { defaultLocale } from "../i18n/locales";
import "./globals.css";

export const metadata: Metadata = { title: "Benchline Stats" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={defaultLocale}>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
