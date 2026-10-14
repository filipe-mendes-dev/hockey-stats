"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "../auth/client";
import { useLanguage } from "../i18n/provider";
import st from "./styles.module.css";

interface AppShellProps {
  children: ReactNode;
  authenticated?: boolean;
}

export function AppShell({ children, authenticated = false }: AppShellProps) {
  const t = useTranslations();
  const { locale, select } = useLanguage();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function signOut(): Promise<void> {
    if (pending) return;
    setPending(true);
    setFailed(false);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setFailed(true);
        return;
      }
      window.location.replace("/sign-in");
    } catch {
      setFailed(true);
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
              {t("auth.signOutFailed")}
            </p>
          )}
        </div>
      </header>
      <main className={st.main}>{children}</main>
    </div>
  );
}
