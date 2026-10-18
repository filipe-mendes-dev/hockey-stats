"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Button, ButtonLink } from "../../../components/Button/Button";
import {
  getServerSyncStatus,
  getSyncStatus,
  requestSynchronization,
  subscribeSyncStatus,
} from "../syncCoordinator";
import st from "./SyncStatusPanel.module.css";

export function SyncStatusPanel() {
  const t = useTranslations("sync");
  const status = useSyncExternalStore(
    subscribeSyncStatus,
    getSyncStatus,
    getServerSyncStatus,
  );

  const message =
    status.phase === "idle"
      ? status.blocked > 0
        ? "blocked"
        : status.pending > 0 || status.lastSyncedAt === null
          ? "saved"
          : "upToDate"
      : status.phase;
  return (
    <aside className={st.panel} aria-label={t("title")}>
      <div className={st.description}>
        <p className={st.account}>
          {t("account", { name: status.accountName })}
        </p>
        <p role="status" aria-live="polite">
          {t(message)}
        </p>
        {status.pending > 0 && <p>{t("pending", { count: status.pending })}</p>}
        {status.blocked > 0 && (
          <p className={st.error}>
            {t("blockedCount", { count: status.blocked })}
          </p>
        )}
      </div>
      <div className={st.actions}>
        {status.phase === "signIn" && (
          <ButtonLink href="/sign-in">{t("signInAction")}</ButtonLink>
        )}
        <Button
          variant="secondary"
          disabled={
            status.phase === "syncing" || status.phase === "unsupported"
          }
          onClick={() => {
            void requestSynchronization(true);
          }}
        >
          {t("retry")}
        </Button>
      </div>
    </aside>
  );
}
