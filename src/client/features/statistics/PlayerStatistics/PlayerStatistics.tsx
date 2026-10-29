"use client";

import { useId, useState } from "react";
import {
  ActionIcon,
  Collapse,
  Select,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useReducedMotion } from "@mantine/hooks";
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { StatisticsPlayerValues } from "../../../../contracts/match-statistics-view.schema";
import { formatMatchTime } from "../../../../domain/matches/matchControl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { CardCounts } from "../CardCounts/CardCounts";
import type {
  PlayerStatisticsColumn,
  PlayerStatisticsProps,
} from "./PlayerStatistics.interfaces";
import st from "./PlayerStatistics.module.css";
import { MatchPlayerIdentity } from "../MatchPlayerIdentity/MatchPlayerIdentity";
import { PlayerStatisticsItem } from "./PlayerStatisticsItem";
import { PlayerStatisticsMetrics } from "./PlayerStatisticsMetrics";

function cardTotal(statistics: StatisticsPlayerValues): number {
  return statistics.cards.yellow + statistics.cards.blue + statistics.cards.red;
}

function sortValue(
  statistics: StatisticsPlayerValues,
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
  onViewPlayer,
  analysisId,
}: PlayerStatisticsProps) {
  const t = useTranslations("statistics");
  const format = useFormatter();
  const { locale } = useLanguage();
  const heading = useId();
  const totalsDetails = useId();
  const reducedMotion = useReducedMotion();
  const [totalsExpanded, setTotalsExpanded] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState<string>();
  const [sort, setSort] = useState<{
    column: PlayerStatisticsColumn;
    ascending: boolean;
  }>({ column: "playingTimeMs", ascending: false });
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const columns: readonly {
    key: PlayerStatisticsColumn;
    label: string;
    detail?: string;
  }[] = [
    { key: "player", label: t("player") },
    { key: "playingTimeMs", label: t("played") },
    { key: "shots", label: t("total") },
    { key: "goals", label: t("goals") },
    {
      key: "onTarget",
      label: t("onTargetShort"),
      detail: t("nonGoalOnTarget"),
    },
    { key: "offTarget", label: t("offTarget") },
    { key: "blocked", label: t("blockedShort"), detail: t("blocked") },
    { key: "recoveries", label: t("recoveriesShort"), detail: t("recoveries") },
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
  const maxima = new Map<Exclude<PlayerStatisticsColumn, "player">, number>();
  for (const { key } of columns) {
    if (key !== "player")
      maxima.set(
        key,
        Math.max(0, ...statistics.map((row) => sortValue(row, key) ?? 0)),
      );
  }

  function metricAttributes(
    row: StatisticsPlayerValues,
    column: Exclude<PlayerStatisticsColumn, "player">,
  ) {
    const value = sortValue(row, column);
    const highest =
      value !== undefined && value > 0 && value === maxima.get(column);
    return {
      "data-maximum": highest,
      title: highest ? t("columnMaximum") : undefined,
    };
  }
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

  function identity(row: StatisticsPlayerValues) {
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
          <MatchPlayerIdentity player={row.player} />
        </UnstyledButton>
      </Tooltip>
    );
  }

  function playingTime(row: StatisticsPlayerValues) {
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
                    title={column.detail ?? column.label}
                    aria-label={t("sortColumn", {
                      column: column.detail ?? column.label,
                    })}
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
                <td {...metricAttributes(row, "playingTimeMs")}>
                  {playingTime(row)}
                </td>
                {actionColumns.map((key) => (
                  <td
                    key={key}
                    {...metricAttributes(row, key)}
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
                <td {...metricAttributes(row, "cards")}>
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
        <div className={st.mobileSort}>
          <Select
            aria-label={t("sortPlayers")}
            value={sort.column}
            data={columns.map((column) => ({
              value: column.key,
              label:
                column.key === "shots"
                  ? t("shots")
                  : (column.detail ?? column.label),
            }))}
            onChange={(value) => {
              const column = columns.find((entry) => entry.key === value);
              if (column)
                setSort({
                  column: column.key,
                  ascending: column.key === "player",
                });
            }}
            allowDeselect={false}
          />
          <ActionIcon
            aria-label={t(sort.ascending ? "sortDescending" : "sortAscending")}
            onClick={() =>
              setSort((previous) => ({
                ...previous,
                ascending: !previous.ascending,
              }))
            }
          >
            {sort.ascending ? (
              <ArrowUp size={16} aria-hidden="true" />
            ) : (
              <ArrowDown size={16} aria-hidden="true" />
            )}
          </ActionIcon>
        </div>
        {sorted.map((row) => (
          <PlayerStatisticsItem
            key={row.player.id}
            row={row}
            expanded={expandedPlayer === row.player.id}
            selected={selectedPlayerId === row.player.id}
            maxima={maxima}
            analysisId={analysisId}
            onToggle={() =>
              setExpandedPlayer((previous) =>
                previous === row.player.id ? undefined : row.player.id,
              )
            }
            onSelect={() => onViewPlayer(row.player.id)}
          />
        ))}
        <div className={st.mobileTotals}>
          <UnstyledButton
            className={st.totalsToggle}
            aria-expanded={totalsExpanded}
            aria-controls={totalsDetails}
            onClick={() => setTotalsExpanded((previous) => !previous)}
          >
            {t("teamTotal")}
            <span className={st.expander} aria-hidden="true">
              <ChevronDown
                size={16}
                className={st.chevron}
                data-expanded={totalsExpanded}
              />
            </span>
          </UnstyledButton>
          <Collapse
            className={st.totalsDetails}
            id={totalsDetails}
            expanded={totalsExpanded}
            transitionDuration={reducedMotion ? 0 : 200}
            transitionTimingFunction="ease-out"
          >
            <PlayerStatisticsMetrics statistics={team} />
          </Collapse>
        </div>
      </div>
      <div className={st.notes}>
        <p>{t("shotNote")}</p>
        <p>{t("playingTimeNote")}</p>
      </div>
    </section>
  );
}
