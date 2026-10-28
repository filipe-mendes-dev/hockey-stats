"use client";

import { useId } from "react";
import { Timer } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { MatchTimeoutStatisticsProps } from "./MatchTimeoutStatistics.interfaces";
import st from "./MatchTimeoutStatistics.module.css";

export function MatchTimeoutStatistics({
  ownTeam,
  opponentTeam,
  timeouts,
  periodLabel,
}: MatchTimeoutStatisticsProps) {
  const t = useTranslations("statistics");
  const format = useFormatter();
  const heading = useId();
  return (
    <section className={st.section} aria-labelledby={heading}>
      <div className={st.heading}>
        <h3 id={heading}>
          <Timer size={13} aria-hidden="true" />
          {t("timeouts")}
        </h3>
        <span className={st.srOnly}>{periodLabel}</span>
      </div>
      <dl className={st.counts}>
        <div>
          <dt title={ownTeam}>{ownTeam}</dt>
          <dd>{format.number(timeouts.own)}</dd>
        </div>
        <div>
          <dt title={opponentTeam}>{opponentTeam}</dt>
          <dd>{format.number(timeouts.opponent)}</dd>
        </div>
      </dl>
    </section>
  );
}
