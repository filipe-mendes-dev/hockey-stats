"use client";

import { useTranslations } from "next-intl";
import { useLocalStorage } from "../storage/use-local-storage";
import st from "./styles.module.css";

interface LocalStorageStatusProps {
  filesCached: boolean;
}

export function LocalStorageStatus({ filesCached }: LocalStorageStatusProps) {
  const t = useTranslations("storage");
  const { status, persistence, retry } = useLocalStorage();

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
