"use client";

import { useFormatter, useTranslations } from "next-intl";
import { getHalfDurationMinutes } from "../../../../domain/matches/matchFormat";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { formatMatchDate } from "../date";
import { MatchStatusBadge } from "../MatchStatusBadge/MatchStatusBadge";
import type { MatchResultProps } from "./MatchResult.interfaces";
import st from "./MatchResult.module.css";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => [...part][0] ?? "")
    .join("")
    .toLocaleUpperCase();
}

export function MatchResult({ match, score, periods }: MatchResultProps) {
  const t = useTranslations("matches");
  const statistics = useTranslations("statistics");
  const format = useFormatter();
  const { locale } = useLanguage();
  const duration = getHalfDurationMinutes(match.periods);
  const metadata = [
    match.scheduledDate
      ? formatMatchDate(match.scheduledDate, locale)
      : undefined,
    match.venueRole ? t(match.venueRole) : undefined,
    duration === undefined
      ? undefined
      : t("matchFormat", { minutes: duration }),
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <section className={st.result} aria-label={t("summaryTitle")}>
      <h1 className={st.srOnly}>{t("summaryTitle")}</h1>
      <div className={st.metadata}>
        <MatchStatusBadge status={match.status} />
        {metadata && <span>{metadata}</span>}
      </div>
      <div className={st.scoreboard}>
        <div className={st.team} data-own>
          <span className={st.initials} aria-hidden="true">
            {initials(match.teamNameAtMatch)}
          </span>
          <h2>{match.teamNameAtMatch}</h2>
        </div>
        <div className={st.score} aria-label={statistics("finalScore")}>
          <strong>
            {score ? format.number(score.own) : "…"}
            <span aria-hidden="true">:</span>
            {score ? format.number(score.opponent) : "…"}
          </strong>
          <span>{statistics("finalScore")}</span>
        </div>
        <div className={st.team}>
          <span className={st.initials} aria-hidden="true">
            {initials(match.opponentName)}
          </span>
          <h2>{match.opponentName}</h2>
          <span className={st.opponent}>{t("opponent")}</span>
        </div>
      </div>
      {periods && (
        <dl className={st.periods}>
          {periods.map((period) => (
            <div key={period.period}>
              <dt>{t("periodLabel", { number: period.period })}</dt>
              <dd
                aria-label={
                  !period.reliable || period.own < 0 || period.opponent < 0
                    ? statistics("periodScoreUnavailable")
                    : undefined
                }
              >
                {!period.reliable || period.own < 0 || period.opponent < 0
                  ? statistics("unavailable")
                  : `${format.number(period.own)} : ${format.number(period.opponent)}`}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
