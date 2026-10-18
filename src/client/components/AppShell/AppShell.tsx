"use client";

import { useEffect, useRef, useState } from "react";
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
import { useLanguage } from "../../i18n/LanguageProvider";
import type { AppShellProps } from "./AppShell.interfaces";
import st from "./AppShell.module.css";

export function AppShell({ children, authenticated = false }: AppShellProps) {
  const t = useTranslations();
  const { locale, select } = useLanguage();
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
      <header className={st.header}>
        <div className={st.headerContent}>
          <span className={st.brand}>{t("shell.title")}</span>
          <div className={st.actions}>
            <label className={st.language}>
              <span>{t("language.label")}</span>
              <select
                value={locale}
                onChange={(event) => select(event.target.value)}
              >
                <option value="en">{t("language.english")}</option>
                <option value="pt-PT">{t("language.portuguese")}</option>
              </select>
            </label>
            {authenticated && (
              <button
                className={st.signOut}
                type="button"
                onClick={signOut}
                disabled={pending}
              >
                {pending ? t("auth.signingOut") : t("auth.signOut")}
              </button>
            )}
          </div>
          {failed && (
            <p className={st.error} role="alert">
              {t(`auth.${failed}`)}
            </p>
          )}
        </div>
      </header>
      <main className={st.main}>
        {failed === "signOutCleanupFailed" ? (
          <h1>{t("auth.signOutCleanupTitle")}</h1>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
