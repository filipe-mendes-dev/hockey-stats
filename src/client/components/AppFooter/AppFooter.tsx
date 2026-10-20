"use client";

import { useState } from "react";
import { Button, Modal, Title } from "@mantine/core";
import { CircleAlert, HardDrive, Info } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { isOfflinePagePath } from "../../../offline-pages";
import { SyncStatusPanel } from "../../features/sync/SyncStatusPanel/SyncStatusPanel";
import { useSyncStatus } from "../../features/sync/useSyncStatus";
import { LocalStorageStatus } from "../../pwa/LocalStorageStatus";
import { PwaStatus } from "../../pwa/PwaStatus";
import { useServiceWorker } from "../../pwa/use-service-worker";
import { useDatabaseStatus } from "../../storage/useDatabaseStatus";
import type { ApplicationStatusProps } from "./AppFooter.interfaces";
import st from "./AppFooter.module.css";

function ApplicationStatus({ worker }: ApplicationStatusProps) {
  const t = useTranslations("footer");
  const pathname = usePathname();
  const storage = useDatabaseStatus();
  const sync = useSyncStatus();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const filesCached = worker.status === "cached" && isOfflinePagePath(pathname);
  const storageIssue = ["failed", "blocked", "closed", "unsupported"].includes(
    storage.status,
  );
  const filesIssue =
    worker.status === "failed" || worker.status === "unsupported";

  return (
    <>
      <div className={st.row}>
        <div className={st.summary}>
          <SyncStatusPanel />
          {worker.updateAvailable && (
            <span className={st.mobileUpdate} role="status">
              {t("updateReady")}
            </span>
          )}
          {!sync.accountName && !storageIssue && (
            <span className={st.hint} role="status">
              <HardDrive size={15} aria-hidden="true" />
              {t(storage.status === "ready" ? "localReady" : "preparing")}
            </span>
          )}
          {storageIssue && (
            <span className={st.issue} role="status">
              <CircleAlert size={15} aria-hidden="true" />
              {t("storageIssue")}
            </span>
          )}
          {filesIssue && (
            <span className={st.issue} role="status">
              <CircleAlert size={15} aria-hidden="true" />
              {t("filesIssue")}
            </span>
          )}
        </div>
        <div className={st.tools}>
          {worker.updateAvailable ? (
            <Button
              className={st.updateAction}
              size="sm"
              variant="subtle"
              onClick={() => setDetailsOpen(true)}
            >
              {t("updateReady")}
            </Button>
          ) : (
            filesCached &&
            storage.status === "ready" && (
              <span className={`${st.hint} ${st.offlineReady}`}>
                {t("offlineReady")}
              </span>
            )
          )}
          <Button
            variant="subtle"
            size="sm"
            leftSection={<Info size={15} aria-hidden="true" />}
            onClick={() => setDetailsOpen(true)}
          >
            {t("details")}
          </Button>
        </div>
      </div>
      <Modal
        opened={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={t("detailsTitle")}
        closeButtonProps={{ "aria-label": t("close") }}
      >
        <div className={st.details}>
          {sync.accountName && (
            <div>
              <Title order={3} className={st.sectionTitle}>
                {t("sync")}
              </Title>
              <SyncStatusPanel details />
            </div>
          )}
          <div>
            <Title order={3} className={st.sectionTitle}>
              {t("storage")}
            </Title>
            <LocalStorageStatus filesCached={filesCached} storage={storage} />
          </div>
          <div>
            <Title order={3} className={st.sectionTitle}>
              {t("installation")}
            </Title>
            <PwaStatus worker={worker} />
          </div>
        </div>
      </Modal>
    </>
  );
}

export function AppFooter() {
  const t = useTranslations("footer");
  const pathname = usePathname();
  const worker = useServiceWorker();
  const isApp = pathname === "/app" || pathname.startsWith("/app/");
  return (
    <footer
      className={st.footer}
      data-auth-page={pathname === "/sign-in"}
      aria-label={t("label")}
    >
      <div className={st.content}>
        {isApp ? (
          <ApplicationStatus worker={worker} />
        ) : (
          <PwaStatus worker={worker} />
        )}
      </div>
    </footer>
  );
}
