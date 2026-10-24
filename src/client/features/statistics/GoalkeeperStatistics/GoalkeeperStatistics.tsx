"use client";

import { useId } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { formatMatchTime } from "../../../../domain/matches/matchControl";
import { CardCounts } from "../CardCounts/CardCounts";
import type { GoalkeeperStatisticsProps } from "./GoalkeeperStatistics.interfaces";
import st from "./GoalkeeperStatistics.module.css";

export function GoalkeeperStatistics({
  statistics,
  unattributedConcededGoals,
  periodLabel,
  selectedPlayerId,
  onSelectPlayer,
  analysisId,
}: GoalkeeperStatisticsProps) {
  const t = useTranslations("statistics");
  const format = useFormatter();
  const heading = useId();
  const goalkeepers = statistics.filter(
    (row) => row.player.role === "goalkeeper",
  );
  if (!goalkeepers.length) return null;
  return (
    <section className={st.section} aria-labelledby={heading}>
      <h2 id={heading}>{t("goalkeepersTitle")}</h2>
      <p>{periodLabel}</p>
      <div className={st.players}>
        {goalkeepers.map((row) => (
          <article
            key={row.player.id}
            data-selected={selectedPlayerId === row.player.id}
          >
            <button
              type="button"
              className={st.identity}
              onClick={() => onSelectPlayer(row.player.id)}
              aria-pressed={selectedPlayerId === row.player.id}
              aria-controls={analysisId}
              aria-label={t("selectPlayer", {
                name: row.player.playerNameAtMatch,
              })}
            >
              <span>
                {row.player.jerseyNumber ? `#${row.player.jerseyNumber}` : ""}
              </span>
              <strong>{row.player.playerNameAtMatch}</strong>
            </button>
            <dl>
              {(
                [
                  "saves",
                  "simpleSaves",
                  "difficultSaves",
                  "concededGoals",
                  "fouls",
                ] as const
              ).map((key) => (
                <div key={key}>
                  <dt>{t(key)}</dt>
                  <dd>{format.number(row[key])}</dd>
                </div>
              ))}
              <div>
                <dt>{t("playingTime")}</dt>
                <dd>
                  {row.playingTimeMs === undefined
                    ? t("unavailable")
                    : formatMatchTime(row.playingTimeMs)}
                </dd>
              </div>
              <div>
                <dt>{t("cards")}</dt>
                <dd>
                  <CardCounts cards={row.cards} showZeros />
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <p>{t("goalkeeperRecordingNote")}</p>
      {unattributedConcededGoals > 0 && (
        <p>
          {t("unattributedGoals", {
            count: format.number(unattributedConcededGoals),
          })}
        </p>
      )}
    </section>
  );
}
