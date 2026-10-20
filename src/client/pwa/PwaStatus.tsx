"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { isOfflinePagePath } from "../../offline-pages";
import { LanguagePicker } from "../components/LanguagePicker/LanguagePicker";
import { LocalStorageStatus } from "./LocalStorageStatus";
import { useServiceWorker } from "./use-service-worker";
import st from "./PwaStatus.module.css";

export function PwaStatus() {
  const t = useTranslations("pwa");
  const pathname = usePathname();
  const { status, updateAvailable, retry } = useServiceWorker();

  return (
    <footer
      className={st.status}
      data-auth-page={pathname === "/sign-in"}
      aria-label={t("statusLabel")}
    >
      <div className={st.language}>
        <LanguagePicker />
      </div>
      <p role="status" aria-live="polite">
        {t(status)}
      </p>
      {status === "failed" && (
        <button className={st.retry} type="button" onClick={retry}>
          {t("retry")}
        </button>
      )}
      {(pathname === "/app" || pathname.startsWith("/app/")) && (
        <LocalStorageStatus
          filesCached={status === "cached" && isOfflinePagePath(pathname)}
        />
      )}
      {updateAvailable && <p role="status">{t("updateAvailable")}</p>}
    </footer>
  );
}
