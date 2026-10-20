"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@mantine/core";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  resumeSynchronization,
  stopSynchronization,
} from "../../features/sync/syncCoordinator";
import { authClient } from "../../features/auth/auth-client";
import {
  clearLocalDatabase,
  closeDatabaseForSignOut,
  localDataClearedEvent,
} from "../../storage/database";
import { PwaStatus } from "../../pwa/PwaStatus";
import { AppHeader } from "../AppHeader/AppHeader";
import type { AppShellProps } from "./AppShell.interfaces";
import st from "./AppShell.module.css";

export function AppShell({ children }: AppShellProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const isSignIn = pathname === "/sign-in";
  const showAccountActions =
    pathname === "/" || pathname === "/app" || pathname.startsWith("/app/");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState<
    "signOutFailed" | "signOutCleanupFailed" | null
  >(null);
  const sessionEnded = useRef(false);

  useEffect(() => {
    function leaveLocalApp(): void {
      stopSynchronization();
      closeDatabaseForSignOut();
      window.location.replace("/sign-in");
    }

    function receiveSignOut(event: StorageEvent): void {
      if (event.key === localDataClearedEvent && event.newValue !== null)
        leaveLocalApp();
    }

    window.addEventListener("storage", receiveSignOut);
    window.addEventListener(localDataClearedEvent, leaveLocalApp);
    return () => {
      window.removeEventListener("storage", receiveSignOut);
      window.removeEventListener(localDataClearedEvent, leaveLocalApp);
    };
  }, []);

  async function signOut(): Promise<void> {
    if (pending) return;
    setPending(true);
    setFailed(null);
    stopSynchronization();
    try {
      if (!sessionEnded.current) {
        const result = await authClient.signOut();
        if (result.error) {
          resumeSynchronization();
          setFailed("signOutFailed");
          return;
        }
        sessionEnded.current = true;
      }
      await clearLocalDatabase();
      window.location.replace("/sign-in");
    } catch {
      if (!sessionEnded.current) resumeSynchronization();
      setFailed(
        sessionEnded.current ? "signOutCleanupFailed" : "signOutFailed",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={st.shell}>
      <a className={st.skipLink} href="#main-content">
        {t("shell.skipToContent")}
      </a>
      <AppHeader>
        {showAccountActions && (
          <Button
            variant="default"
            type="button"
            onClick={signOut}
            disabled={pending}
          >
            {pending ? t("auth.signingOut") : t("auth.signOut")}
          </Button>
        )}
      </AppHeader>
      {failed && (
        <p className={st.error} role="alert">
          {t(`auth.${failed}`)}
        </p>
      )}
      <main
        id="main-content"
        className={st.main}
        data-auth-page={isSignIn}
        tabIndex={-1}
      >
        {failed === "signOutCleanupFailed" ? (
          <h1>{t("auth.signOutCleanupTitle")}</h1>
        ) : (
          children
        )}
      </main>
      <PwaStatus />
    </div>
  );
}
