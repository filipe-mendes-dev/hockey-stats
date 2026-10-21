"use client";

import { Group } from "@mantine/core";
import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { formatMatchDate } from "../date";
import type { MatchReviewSummaryProps } from "./MatchReviewSummary.interfaces";
import st from "./MatchReviewSummary.module.css";

export function MatchReviewSummary({
  team,
  opponent,
  scheduledDate,
  venueRole,
  durationMinutes,
}: MatchReviewSummaryProps) {
  const t = useTranslations("matches");
  const { locale } = useLanguage();
  const teamContext = [team?.category, team?.season]
    .filter(Boolean)
    .join(" · ");
  const venue =
    venueRole === "home" || venueRole === "away" || venueRole === "neutral"
      ? t(venueRole)
      : null;
  return (
    <section className={st.summary} aria-label={t("detailsStep")}>
      <h3 className={st.title}>
        {t("matchLabel", {
          team: team?.name ?? t("team"),
          opponent: opponent.trim(),
        })}
      </h3>
      {teamContext && <p className={st.context}>{teamContext}</p>}
      {
        <Group gap="md" className={st.context}>
          {scheduledDate && (
            <time dateTime={scheduledDate}>
              {formatMatchDate(scheduledDate, locale)}
            </time>
          )}
          {venue && <span>{venue}</span>}
          <span>{t("matchFormat", { minutes: durationMinutes })}</span>
        </Group>
      }
    </section>
  );
}
