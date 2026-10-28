"use client";

import { useFormatter, useTranslations } from "next-intl";
import { CardCounts } from "../CardCounts/CardCounts";
import type { PlayerStatisticsMetricsProps } from "./PlayerStatisticsMetrics.interfaces";
import st from "./PlayerStatisticsMetrics.module.css";

export function PlayerStatisticsMetrics({
  statistics,
  maxima,
}: PlayerStatisticsMetricsProps) {
  const t = useTranslations("statistics");
  const format = useFormatter();
  const keys = [
    "goals",
    "shots",
    "onTarget",
    "offTarget",
    "blocked",
    "recoveries",
    "losses",
    "fouls",
  ] as const;
  const cards =
    statistics.cards.yellow + statistics.cards.blue + statistics.cards.red;
  return (
    <dl className={st.metrics}>
      {keys.map((key) => (
        <div key={key}>
          <dt>{t(key === "onTarget" ? "nonGoalOnTarget" : key)}</dt>
          <dd
            data-goal={key === "goals" && statistics.goals > 0}
            data-maximum={
              statistics[key] > 0 && maxima?.get(key) === statistics[key]
            }
          >
            {format.number(statistics[key])}
          </dd>
        </div>
      ))}
      <div>
        <dt>{t("cards")}</dt>
        <dd data-maximum={cards > 0 && maxima?.get("cards") === cards}>
          {cards ? <CardCounts cards={statistics.cards} /> : format.number(0)}
        </dd>
      </div>
    </dl>
  );
}
