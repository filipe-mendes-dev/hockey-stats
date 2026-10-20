"use client";

import { useTranslations } from "next-intl";
import { useDatabaseStatus } from "../storage/useDatabaseStatus";
import type { LocalStorageStatusProps } from "./LocalStorageStatus.interfaces";
import st from "./LocalStorageStatus.module.css";

export function LocalStorageStatus({ filesCached }: LocalStorageStatusProps) {
  const t = useTranslations("storage");
  const { status, persistence, retry } = useDatabaseStatus();

  return (
    <div>
      <p role="status" aria-live="polite">
        {status === "ready" && filesCached ? t("offlineReady") : t(status)}
      </p>
      {status === "ready" && persistence !== null && (
        <p>{t(`persistence.${persistence}`)}</p>
      )}
      {(status === "failed" || status === "closed") && (
        <button className={st.retry} type="button" onClick={retry}>
          {t("retry")}
        </button>
      )}
    </div>
  );
}
