import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { LanguageProvider } from "../client/i18n/LanguageProvider";
import { AppShell } from "../client/components/AppShell/AppShell";
import { ThemeProvider } from "../client/components/ThemeProvider/ThemeProvider";
import { defaultLocale } from "../i18n/locales";
import "@mantine/core/styles.layer.css";
import "@mantine/dates/styles.layer.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Benchline Stats",
  applicationName: "Benchline Stats",
  appleWebApp: { capable: true, title: "Benchline Stats" },
  icons: {
    icon: { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = { themeColor: "#141518" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={defaultLocale} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript forceColorScheme="dark" />
      </head>
      <body>
        <LanguageProvider>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
