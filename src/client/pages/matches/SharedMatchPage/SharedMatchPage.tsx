"use client";

import { Button } from "@mantine/core";
import { useTranslations } from "next-intl";
import { CompletedMatchStatistics } from "../../../features/statistics/CompletedMatchStatistics/CompletedMatchStatistics";
import type {
  SharedMatchPageProps,
  SharedMatchUnavailableProps,
} from "./SharedMatchPage.interfaces";
import st from "./SharedMatchPage.module.css";

export function SharedMatchPage({ view }: SharedMatchPageProps) {
  return <CompletedMatchStatistics view={view} />;
}

export function SharedMatchUnavailable({
  failed = false,
}: SharedMatchUnavailableProps) {
  const t = useTranslations("sharing");
  return (
    <section className={st.unavailable}>
      <h1>{t(failed ? "failedTitle" : "unavailableTitle")}</h1>
      <p>{t(failed ? "failedDescription" : "unavailableDescription")}</p>
      {failed && (
        <Button onClick={() => window.location.reload()}>{t("retry")}</Button>
      )}
    </section>
  );
}
