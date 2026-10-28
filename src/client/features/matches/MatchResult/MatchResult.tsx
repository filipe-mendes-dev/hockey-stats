"use client";

import { useFormatter, useTranslations } from "next-intl";
import { CalendarDays, House, MapPin } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { formatMatchDate } from "../date";
import type { MatchResultProps } from "./MatchResult.interfaces";
import st from "./MatchResult.module.css";

export function MatchResult({
  match,
  category,
  score,
  periods,
}: MatchResultProps) {
  const t = useTranslations("matches");
  const statistics = useTranslations("statistics");
  const format = useFormatter();
  const { locale } = useLanguage();
  const teams = useTranslations("teams");
  const opponentFirst = match.venueRole === "away";
  const participants = opponentFirst
    ? [
        { name: match.opponentName, own: false },
        { name: match.teamNameAtMatch, own: true },
      ]
    : [
        { name: match.teamNameAtMatch, own: true },
        { name: match.opponentName, own: false },
      ];
  const VenueIcon = match.venueRole === "home" ? House : MapPin;

  function participant(index: number) {
    const team = participants[index];
    if (!team) return null;
    return (
      <div className={st.team} data-side={index === 0 ? "left" : "right"}>
        <h2>{team.name}</h2>
      </div>
    );
  }
  return (
    <section className={st.result} aria-label={t("summaryTitle")}>
      <h1 className={st.srOnly}>{t("summaryTitle")}</h1>
      <div className={st.metadata}>
        {match.scheduledDate && (
          <time className={st.date} dateTime={match.scheduledDate}>
            <CalendarDays size={16} aria-hidden="true" />
            {formatMatchDate(match.scheduledDate, locale)}
          </time>
        )}
        {match.venueRole && (
          <span className={st.venue}>
            <VenueIcon size={12} aria-hidden="true" />
            {t(match.venueRole)}
          </span>
        )}
        {category && (
          <span className={st.category} title={teams("category")}>
            {category}
          </span>
        )}
      </div>
      <div className={st.scoreboard}>
        {participant(0)}
        <div
          className={st.score}
          role="group"
          aria-label={statistics("finalScore")}
        >
          <strong>
            {score
              ? format.number(opponentFirst ? score.opponent : score.own)
              : "…"}
            <span aria-hidden="true">:</span>
            {score
              ? format.number(opponentFirst ? score.own : score.opponent)
              : "…"}
          </strong>
        </div>
        {participant(1)}
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
                  : `${format.number(opponentFirst ? period.opponent : period.own)} : ${format.number(opponentFirst ? period.own : period.opponent)}`}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
