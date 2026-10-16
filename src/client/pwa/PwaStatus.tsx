"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { isOfflinePagePath } from "../../offline-pages";
import { LocalStorageStatus } from "./LocalStorageStatus";
import { useServiceWorker } from "./use-service-worker";
import st from "./PwaStatus.module.css";

export function PwaStatus() {
  const t = useTranslations("pwa");
  const pathname = usePathname();
  const { status, updateAvailable, retry } = useServiceWorker();

  return (
    <footer className={st.status}>
      <p role="status" aria-live="polite">
        {t(status)}
      </p>
      {status === "failed" && (
        <button className={st.retry} type="button" onClick={retry}>
          {t("retry")}
        </button>
      )}
      {isOfflinePagePath(pathname) && (
        <LocalStorageStatus filesCached={status === "cached"} />
      )}
      {updateAvailable && <p role="status">{t("updateAvailable")}</p>}
    </footer>
  );
}
