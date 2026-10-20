"use client";

import { useTranslations } from "next-intl";
import { Button } from "@mantine/core";
import type { LocalStorageStatusProps } from "./LocalStorageStatus.interfaces";

export function LocalStorageStatus({
  filesCached,
  storage,
}: LocalStorageStatusProps) {
  const t = useTranslations("storage");
  const { status, persistence, retry } = storage;

  return (
    <div>
      <p role="status" aria-live="polite">
        {status === "ready" && filesCached ? t("offlineReady") : t(status)}
      </p>
      {status === "ready" && persistence !== null && (
        <p>{t(`persistence.${persistence}`)}</p>
      )}
      {(status === "failed" || status === "closed") && (
        <Button size="sm" variant="default" type="button" onClick={retry}>
          {t("retry")}
        </Button>
      )}
    </div>
  );
}
