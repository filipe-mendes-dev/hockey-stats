import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { LanguageProvider } from "../client/i18n/LanguageProvider";
import { PwaStatus } from "../client/pwa/PwaStatus";
import { defaultLocale } from "../i18n/locales";
import "./globals.css";

export const metadata: Metadata = {
  title: "Benchline Stats",
  applicationName: "Benchline Stats",
  appleWebApp: { capable: true, title: "Benchline Stats" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#141518" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={defaultLocale}>
      <body>
        <LanguageProvider>
          {children}
          <PwaStatus />
        </LanguageProvider>
      </body>
    </html>
  );
}
