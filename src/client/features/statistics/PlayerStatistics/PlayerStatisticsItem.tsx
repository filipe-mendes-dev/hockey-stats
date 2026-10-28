"use client";

import { useId } from "react";
import { Button, Collapse, UnstyledButton } from "@mantine/core";
import { useReducedMotion } from "@mantine/hooks";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatMatchTime } from "../../../../domain/matches/matchControl";
import { MatchPlayerIdentity } from "../MatchPlayerIdentity/MatchPlayerIdentity";
import type { PlayerStatisticsItemProps } from "./PlayerStatisticsItem.interfaces";
import { PlayerStatisticsMetrics } from "./PlayerStatisticsMetrics";
import st from "./PlayerStatisticsItem.module.css";

export function PlayerStatisticsItem({
  row,
  expanded,
  selected,
  maxima,
  analysisId,
  onToggle,
  onSelect,
}: PlayerStatisticsItemProps) {
  const t = useTranslations("statistics");
  const details = useId();
  const reducedMotion = useReducedMotion();
  const time =
    row.playingTimeMs === undefined
      ? t("unavailable")
      : formatMatchTime(row.playingTimeMs);
  return (
    <article
      className={st.item}
      data-selected={selected}
      data-player-statistics={row.player.id}
    >
      <UnstyledButton
        className={st.toggle}
        aria-expanded={expanded}
        aria-controls={details}
        aria-label={t(expanded ? "collapsePlayer" : "expandPlayer", {
          name: row.player.playerNameAtMatch,
          time:
            row.playingTimeMs === undefined
              ? t("playingTimeUnavailable")
              : t("playingTimeValue", { time }),
        })}
        onClick={onToggle}
      >
        <MatchPlayerIdentity player={row.player} />
        <span
          className={st.time}
          aria-label={
            row.playingTimeMs === undefined
              ? t("playingTimeUnavailable")
              : t("playingTimeValue", { time })
          }
          data-maximum={
            row.playingTimeMs !== undefined &&
            row.playingTimeMs > 0 &&
            maxima.get("playingTimeMs") === row.playingTimeMs
          }
        >
          {time}
          {row.playingTimeMs !== undefined && (
            <span className={st.unit} aria-hidden="true">
              {t("minutesShort")}
            </span>
          )}
        </span>
        <span className={st.expander} aria-hidden="true">
          <ChevronDown
            size={16}
            className={st.chevron}
            data-expanded={expanded}
          />
        </span>
      </UnstyledButton>
      <div className={st.summary}>
        <span>
          {t("playerGoalShots", { goals: row.goals, shots: row.shots })}
        </span>
        <span>
          {t("playerBallSummary", {
            recoveries: row.recoveries,
            losses: row.losses,
          })}
        </span>
      </div>
      <Collapse
        className={st.details}
        id={details}
        expanded={expanded}
        transitionDuration={reducedMotion ? 0 : 200}
        transitionTimingFunction="ease-out"
      >
        <PlayerStatisticsMetrics statistics={row} maxima={maxima} />
        <Button
          variant="default"
          size="sm"
          aria-pressed={selected}
          aria-controls={analysisId}
          onClick={onSelect}
        >
          {t("viewPlayerEvents")}
        </Button>
      </Collapse>
    </article>
  );
}
