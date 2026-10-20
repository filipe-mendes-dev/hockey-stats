"use client";

import { Button } from "@mantine/core";
import { useTranslations } from "next-intl";
import type { PwaStatusProps } from "./PwaStatus.interfaces";
import st from "./PwaStatus.module.css";

export function PwaStatus({
  worker: { status, updateAvailable, retry },
}: PwaStatusProps) {
  const t = useTranslations("pwa");
  return (
    <section className={st.status} aria-label={t("statusLabel")}>
      <p role="status">{t(status)}</p>
      {status === "failed" && (
        <Button size="sm" variant="default" onClick={retry}>
          {t("retry")}
        </Button>
      )}
      {updateAvailable && <p role="status">{t("updateAvailable")}</p>}
    </section>
  );
}
