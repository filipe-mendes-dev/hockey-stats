"use client";

import { useState } from "react";
import { Modal, Title } from "@mantine/core";
import { CircleAlert, HardDrive, Mail } from "lucide-react";
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
import {
  applicationContact,
  applicationCopyrightYear,
  applicationVersion,
} from "./appMetadata";
import st from "./AppFooter.module.css";

function FooterIdentity() {
  const t = useTranslations("footer");
  return (
    <div className={st.identity}>
      <span>{t("copyright", { year: applicationCopyrightYear })}</span>
      <span>
        {t("beta")} · {t("version", { version: applicationVersion })}
      </span>
    </div>
  );
}

function ContactLink() {
  const t = useTranslations("footer");
  return (
    <a
      className={st.contact}
      href={`mailto:${applicationContact}`}
      title={applicationContact}
    >
      <Mail size={14} aria-hidden="true" />
      {t("contact")}
    </a>
  );
}

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
        <FooterIdentity />
        <div className={st.summary}>
          <SyncStatusPanel onOpenDetails={() => setDetailsOpen(true)} />
          {!sync.accountName && !storageIssue && (
            <button
              className={st.statusControl}
              type="button"
              aria-haspopup="dialog"
              aria-label={t(
                storage.status === "ready" ? "localReady" : "preparing",
              )}
              onClick={() => setDetailsOpen(true)}
            >
              <HardDrive size={15} aria-hidden="true" />
              <span role="status">
                {t(storage.status === "ready" ? "localReady" : "preparing")}
              </span>
            </button>
          )}
          {storageIssue && (
            <button
              className={`${st.statusControl} ${st.issue}`}
              type="button"
              aria-haspopup="dialog"
              aria-label={t("storageIssue")}
              onClick={() => setDetailsOpen(true)}
            >
              <CircleAlert size={15} aria-hidden="true" />
              <span role="status">{t("storageIssue")}</span>
            </button>
          )}
          {filesIssue && (
            <button
              className={`${st.statusControl} ${st.issue}`}
              type="button"
              aria-haspopup="dialog"
              aria-label={t("filesIssue")}
              onClick={() => setDetailsOpen(true)}
            >
              <CircleAlert size={15} aria-hidden="true" />
              <span role="status">{t("filesIssue")}</span>
            </button>
          )}
          {worker.updateAvailable && (
            <button
              className={st.statusControl}
              type="button"
              aria-haspopup="dialog"
              aria-label={t("updateReady")}
              onClick={() => setDetailsOpen(true)}
            >
              <span role="status">{t("updateReady")}</span>
            </button>
          )}
        </div>
        <ContactLink />
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
  if (pathname === "/sign-in") return null;
  return (
    <footer className={st.footer} aria-label={t("label")}>
      <div className={st.content}>
        {isApp ? (
          <ApplicationStatus worker={worker} />
        ) : (
          <div className={st.publicRow}>
            <FooterIdentity />
            <PwaStatus worker={worker} />
            <ContactLink />
          </div>
        )}
      </div>
    </footer>
  );
}
