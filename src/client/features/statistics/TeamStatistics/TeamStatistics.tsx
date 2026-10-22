"use client";

import { useFormatter, useTranslations } from "next-intl";
import { CardCounts } from "../CardCounts/CardCounts";
import type { TeamStatisticsProps } from "./TeamStatistics.interfaces";
import st from "./TeamStatistics.module.css";

export function TeamStatistics({ statistics }: TeamStatisticsProps) {
  const t = useTranslations("statistics");
  const format = useFormatter();
  function percentage(value: number): string {
    return statistics.shots
      ? format.number(value / statistics.shots, {
          style: "percent",
          maximumFractionDigits: 1,
        })
      : t("unavailable");
  }
  const metrics = [
    {
      label: t("shots"),
      value: statistics.shots,
      note: t("conversion", {
        goals: statistics.goals,
        rate: percentage(statistics.goals),
      }),
    },
    {
      label: t("onTarget"),
      value: statistics.goals + statistics.onTarget,
      note: t("shotShare", {
        rate: percentage(statistics.goals + statistics.onTarget),
      }),
    },
    {
      label: t("recoveries"),
      value: statistics.recoveries,
      note: t("recordedRecoveries"),
    },
    { label: t("losses"), value: statistics.losses, note: t("recordedLosses") },
    { label: t("fouls"), value: statistics.fouls, note: t("committed") },
  ];
  return (
    <dl className={st.metrics}>
      {metrics.map((metric) => (
        <div key={metric.label} className={st.metric}>
          <dt>{metric.label}</dt>
          <dd>
            <strong>{format.number(metric.value)}</strong>
            <span>{metric.note}</span>
          </dd>
        </div>
      ))}
      <div className={st.metric}>
        <dt>{t("cards")}</dt>
        <dd>
          <div className={st.cards}>
            <CardCounts cards={statistics.cards} showZeros />
          </div>
          <span>{t("cardOrder")}</span>
        </dd>
      </div>
    </dl>
  );
}
