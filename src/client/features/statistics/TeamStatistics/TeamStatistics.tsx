"use client";

import { useFormatter, useTranslations } from "next-intl";
import { CardCounts } from "../CardCounts/CardCounts";
import { MatchEventIcon } from "../../../components/MatchEventIcon/MatchEventIcon";
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
      kind: "shot",
      tone: "blue",
      detail: t("shotSummary", {
        goals: statistics.goals,
        rate: percentage(statistics.goals),
      }),
    },
    {
      label: t("onTarget"),
      value: statistics.goals + statistics.onTarget,
      kind: "shot",
      tone: "blue",
      detail: t("onTargetSummary", {
        rate: percentage(statistics.goals + statistics.onTarget),
      }),
    },
    {
      label: t("recoveries"),
      value: statistics.recoveries,
      kind: "ball-recovery",
      tone: "action",
      detail: undefined,
    },
    {
      label: t("losses"),
      value: statistics.losses,
      kind: "ball-loss",
      tone: "red",
      detail: undefined,
    },
    {
      label: t("fouls"),
      value: statistics.fouls,
      kind: "team-foul",
      tone: "yellow",
      detail: undefined,
    },
  ] as const;
  return (
    <div className={st.summary}>
      <dl className={st.metrics}>
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={st.metric}
            data-event-tone={metric.tone}
          >
            <dt>
              <MatchEventIcon kind={metric.kind} size={14} />
              {metric.label}
            </dt>
            <dd>
              <strong>{format.number(metric.value)}</strong>
              {metric.detail && (
                <span className={st.detail}>{metric.detail}</span>
              )}
            </dd>
          </div>
        ))}
        <div className={st.metric} data-event-tone="muted">
          <dt>
            <MatchEventIcon kind="card" size={14} />
            {t("cards")}
          </dt>
          <dd>
            <div className={st.cards}>
              <CardCounts cards={statistics.cards} showZeros />
            </div>
          </dd>
        </div>
      </dl>
    </div>
  );
}
