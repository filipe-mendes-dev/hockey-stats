"use client";

import { useId, useState } from "react";
import { Tooltip, UnstyledButton } from "@mantine/core";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { PlayerMatchStatistics } from "../../../../domain/matches/matchStatistics";
import { formatMatchTime } from "../../../../domain/matches/matchControl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { CardCounts } from "../CardCounts/CardCounts";
import type {
  PlayerStatisticsColumn,
  PlayerStatisticsProps,
} from "./PlayerStatistics.interfaces";
import st from "./PlayerStatistics.module.css";

function cardTotal(statistics: PlayerMatchStatistics): number {
  return statistics.cards.yellow + statistics.cards.blue + statistics.cards.red;
}

function sortValue(
  statistics: PlayerMatchStatistics,
  column: Exclude<PlayerStatisticsColumn, "player">,
): number | undefined {
  return column === "cards" ? cardTotal(statistics) : statistics[column];
}

export function PlayerStatistics({
  statistics,
  team,
  periodLabel,
  selectedPlayerId,
  onSelectPlayer,
  analysisId,
}: PlayerStatisticsProps) {
  const t = useTranslations("statistics");
  const assignment = useTranslations("teamPlayers");
  const format = useFormatter();
  const { locale } = useLanguage();
  const heading = useId();
  const [sort, setSort] = useState<{
    column: PlayerStatisticsColumn;
    ascending: boolean;
  }>({ column: "playingTimeMs", ascending: false });
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const columns: readonly { key: PlayerStatisticsColumn; label: string }[] = [
    { key: "player", label: t("player") },
    { key: "playingTimeMs", label: t("played") },
    { key: "shots", label: t("total") },
    { key: "goals", label: t("goals") },
    { key: "onTarget", label: t("onTargetShort") },
    { key: "offTarget", label: t("offTarget") },
    { key: "blocked", label: t("blocked") },
    { key: "recoveries", label: t("recoveriesShort") },
    { key: "losses", label: t("losses") },
    { key: "fouls", label: t("fouls") },
    { key: "cards", label: t("cards") },
  ];
  const actionColumns = [
    "shots",
    "goals",
    "onTarget",
    "offTarget",
    "blocked",
    "recoveries",
    "losses",
    "fouls",
  ] as const;
  const sorted = [...statistics].sort((left, right) => {
    const names = collator.compare(
      left.player.playerNameAtMatch,
      right.player.playerNameAtMatch,
    );
    if (sort.column === "player") return sort.ascending ? names : -names;
    const a = sortValue(left, sort.column);
    const b = sortValue(right, sort.column);
    if (a === undefined) return b === undefined ? names : 1;
    if (b === undefined) return -1;
    return (sort.ascending ? a - b : b - a) || names;
  });

  function identity(row: PlayerMatchStatistics) {
    return (
      <Tooltip
        label={t("selectPlayer", { name: row.player.playerNameAtMatch })}
        events={{ hover: true, focus: true, touch: true }}
      >
        <UnstyledButton
          className={st.player}
          aria-label={t("selectPlayer", { name: row.player.playerNameAtMatch })}
          aria-pressed={selectedPlayerId === row.player.id}
          aria-controls={analysisId}
          onClick={() => onSelectPlayer(row.player.id)}
        >
          <span className={st.number} aria-hidden="true">
            {row.player.jerseyNumber || "—"}
          </span>
          <span className={st.identity}>
            <strong>{row.player.playerNameAtMatch}</strong>
            <span>{assignment(row.player.role)}</span>
          </span>
        </UnstyledButton>
      </Tooltip>
    );
  }

  function playingTime(row: PlayerMatchStatistics) {
    return row.playingTimeMs === undefined ? (
      <span className={st.zero} aria-label={t("playingTimeUnavailable")}>
        {t("unavailable")}
      </span>
    ) : (
      formatMatchTime(row.playingTimeMs)
    );
  }

  return (
    <section className={st.section} aria-labelledby={heading}>
      <div className={st.heading}>
        <div>
          <h2 id={heading}>{t("playersTitle")}</h2>
          <p>
            {t("playerContext", {
              period: periodLabel,
              count: statistics.length,
            })}
          </p>
        </div>
        <span>{t("playerHint")}</span>
      </div>
      <div className={st.tableWrap}>
        <table className={st.table}>
          <caption className={st.srOnly}>{t("playersTitle")}</caption>
          <colgroup>
            <col className={st.playerCol} />
            <col className={st.timeCol} />
            <col span={5} className={st.shotCol} />
            <col span={2} className={st.ballCol} />
            <col className={st.foulCol} />
            <col className={st.cardCol} />
          </colgroup>
          <thead>
            <tr className={st.groups}>
              <th colSpan={2} aria-hidden="true" />
              <th colSpan={5} scope="colgroup">
                {t("shots")}
              </th>
              <th colSpan={2} scope="colgroup">
                {t("ballActions")}
              </th>
              <th colSpan={2} scope="colgroup">
                {t("discipline")}
              </th>
            </tr>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    sort.column === column.key
                      ? sort.ascending
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <UnstyledButton
                    className={st.sort}
                    aria-label={t("sortColumn", { column: column.label })}
                    onClick={() =>
                      setSort({
                        column: column.key,
                        ascending:
                          sort.column === column.key
                            ? !sort.ascending
                            : column.key === "player",
                      })
                    }
                  >
                    {column.label}
                    {sort.column === column.key &&
                      (sort.ascending ? (
                        <ArrowUp size={12} aria-hidden="true" />
                      ) : (
                        <ArrowDown size={12} aria-hidden="true" />
                      ))}
                  </UnstyledButton>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.player.id}
                data-selected={selectedPlayerId === row.player.id}
              >
                <th scope="row">{identity(row)}</th>
                <td>{playingTime(row)}</td>
                {actionColumns.map((key) => (
                  <td
                    key={key}
                    className={
                      row[key] === 0
                        ? st.zero
                        : key === "goals"
                          ? st.goals
                          : undefined
                    }
                  >
                    {format.number(row[key])}
                  </td>
                ))}
                <td>
                  {cardTotal(row) ? (
                    <CardCounts cards={row.cards} />
                  ) : (
                    <span className={st.zero}>{format.number(0)}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">{t("teamTotal")}</th>
              <td>{t("unavailable")}</td>
              {actionColumns.map((key) => (
                <td key={key}>{format.number(team[key])}</td>
              ))}
              <td>
                <CardCounts cards={team.cards} showZeros />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className={st.mobile}>
        {sorted.map((row) => (
          <article
            key={row.player.id}
            className={st.mobileRow}
            data-selected={selectedPlayerId === row.player.id}
          >
            <div className={st.mobileHeading}>
              {identity(row)}
              <div className={st.played}>
                {playingTime(row)}
                <span>{t("playingTime")}</span>
              </div>
            </div>
            <dl className={st.mobileMain}>
              {(["goals", "shots", "recoveries", "losses"] as const).map(
                (key) => (
                  <div key={key}>
                    <dt>{t(key)}</dt>
                    <dd
                      className={
                        key === "goals" && row.goals ? st.goals : undefined
                      }
                    >
                      {format.number(row[key])}
                    </dd>
                  </div>
                ),
              )}
            </dl>
            <dl className={st.mobileOutcomes}>
              {(["onTarget", "offTarget", "blocked"] as const).map((key) => (
                <div key={key}>
                  <dt>{t(key === "onTarget" ? "nonGoalOnTarget" : key)}</dt>
                  <dd>{format.number(row[key])}</dd>
                </div>
              ))}
            </dl>
            <div className={st.discipline}>
              <span>
                {t("fouls")} {format.number(row.fouls)}
              </span>
              <span>
                {t("cards")} {format.number(cardTotal(row))}
              </span>
              {cardTotal(row) > 0 && <CardCounts cards={row.cards} />}
            </div>
          </article>
        ))}
      </div>
      <div className={st.notes}>
        <p>{t("shotNote")}</p>
        <p>{t("playingTimeNote")}</p>
      </div>
    </section>
  );
}
