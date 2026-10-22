"use client";

import { Badge, Group } from "@mantine/core";
import { useTranslations } from "next-intl";
import type { MatchCallUpSummaryProps } from "./MatchCallUpSummary.interfaces";
import st from "./MatchCallUpSummary.module.css";

export function MatchCallUpSummary({ players }: MatchCallUpSummaryProps) {
  const t = useTranslations("matches");
  const fields = players.filter(
    (player) => player.role === "field-player",
  ).length;
  const keepers = players.filter(
    (player) => player.role === "goalkeeper",
  ).length;
  return (
    <Group className={st.summary} gap="sm" role="status">
      <Badge
        className={st.total}
        variant="light"
        aria-label={t("selected", { count: players.length })}
      >
        {t("selectedCompact", { count: players.length })}
      </Badge>
      <span aria-label={t("fieldCount", { count: fields })}>
        {t("fieldCountCompact", { count: fields })}
      </span>
      <span aria-label={t("keeperCount", { count: keepers })}>
        {t("keeperCountCompact", { count: keepers })}
      </span>
    </Group>
  );
}
