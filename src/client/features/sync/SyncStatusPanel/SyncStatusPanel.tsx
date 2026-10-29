"use client";

import Link from "next/link";
import { Button } from "@mantine/core";
import { CircleAlert, Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { requestSynchronization } from "../syncCoordinator";
import { useSyncStatus } from "../useSyncStatus";
import type { SyncStatusPanelProps } from "./SyncStatusPanel.interfaces";
import st from "./SyncStatusPanel.module.css";

export function SyncStatusPanel({
  details = false,
  onOpenDetails,
}: SyncStatusPanelProps) {
  const t = useTranslations("sync");
  const status = useSyncStatus();
  if (!status.accountName) return null;
  const message =
    status.phase === "idle"
      ? status.blocked > 0
        ? "blocked"
        : status.pending > 0 || status.lastSyncedAt === null
          ? "saved"
          : "upToDate"
      : status.phase;
  const needsAttention =
    status.blocked > 0 ||
    ["failed", "mismatch", "unsupported"].includes(status.phase);
  const Icon = needsAttention
    ? CircleAlert
    : status.phase === "offline"
      ? CloudOff
      : status.phase === "syncing"
        ? RefreshCw
        : Cloud;

  if (details) {
    return (
      <section className={st.details} aria-label={t("title")}>
        <p className={st.account}>
          {t("account", { name: status.accountName })}
        </p>
        <p role="status">{t(message)}</p>
        {status.pending > 0 && <p>{t("pending", { count: status.pending })}</p>}
        {status.blocked > 0 && (
          <p className={st.issue}>
            {t("blockedCount", { count: status.blocked })}
          </p>
        )}
        <div className={st.actions}>
          {status.phase === "signIn" && (
            <Button component={Link} prefetch={false} href="/sign-in" size="sm">
              {t("signInAction")}
            </Button>
          )}
          <Button
            size="sm"
            variant="default"
            leftSection={<RefreshCw size={15} aria-hidden="true" />}
            disabled={
              status.phase === "syncing" || status.phase === "unsupported"
            }
            onClick={() => void requestSynchronization(true)}
          >
            {t("retry")}
          </Button>
        </div>
      </section>
    );
  }

  const statusMessage = (
    <span
      className={needsAttention ? `${st.message} ${st.issue}` : st.message}
      role="status"
      aria-live="polite"
    >
      <Icon
        size={16}
        aria-hidden="true"
        className={status.phase === "syncing" ? st.spinning : undefined}
      />
      <span>{t(`short.${message}`)}</span>
      {status.pending > 0 && (
        <span className={st.count}>
          {t("pendingShort", { count: status.pending })}
        </span>
      )}
      {status.blocked > 0 && (
        <span>{t("blockedShort", { count: status.blocked })}</span>
      )}
    </span>
  );

  if (onOpenDetails) {
    return (
      <button
        className={st.trigger}
        type="button"
        aria-haspopup="dialog"
        aria-label={[
          t(`short.${message}`),
          status.pending > 0
            ? t("pendingShort", { count: status.pending })
            : null,
          status.blocked > 0
            ? t("blockedShort", { count: status.blocked })
            : null,
        ]
          .filter(Boolean)
          .join(". ")}
        onClick={onOpenDetails}
      >
        {statusMessage}
      </button>
    );
  }

  return (
    <div className={st.summary}>
      {statusMessage}
      {status.phase === "signIn" && (
        <Button
          component={Link}
          prefetch={false}
          href="/sign-in"
          variant="subtle"
          size="sm"
        >
          {t("signInAction")}
        </Button>
      )}
    </div>
  );
}
