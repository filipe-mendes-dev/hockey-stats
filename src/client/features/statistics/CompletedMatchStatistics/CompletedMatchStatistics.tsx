"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MatchResult } from "../../matches/MatchResult/MatchResult";
import { MatchPeriodFilter } from "../MatchPeriodFilter/MatchPeriodFilter";
import { TeamStatistics } from "../TeamStatistics/TeamStatistics";
import { MatchEventAnalysis } from "../MatchEventAnalysis/MatchEventAnalysis";
import { MatchTimeoutStatistics } from "../MatchTimeoutStatistics/MatchTimeoutStatistics";
import { PlayerStatistics } from "../PlayerStatistics/PlayerStatistics";
import { GoalkeeperStatistics } from "../GoalkeeperStatistics/GoalkeeperStatistics";
import type { CompletedMatchStatisticsProps } from "./CompletedMatchStatistics.interfaces";
import st from "./CompletedMatchStatistics.module.css";

export function CompletedMatchStatistics({
  view,
}: CompletedMatchStatisticsProps) {
  const t = useTranslations("matches");
  const statisticsText = useTranslations("statistics");
  const [period, setPeriod] = useState<number>();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>();
  const analysisId = useId();
  const teamHeading = useId();
  const analysisRef = useRef<HTMLDivElement>(null);
  const statistics = view.statistics.find(
    (entry) => entry.period === period,
  )?.values;
  if (!statistics) return null;
  const periodLabel =
    period === undefined
      ? statisticsText("allMatch")
      : t("periodLabel", { number: period });

  function viewPlayer(id: string): void {
    setSelectedPlayerId(id);
    analysisRef.current?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  function selectPlayer(id: string): void {
    if (selectedPlayerId === id) setSelectedPlayerId(undefined);
    else viewPlayer(id);
  }

  return (
    <div className={st.page} data-completed-match>
      <MatchResult
        match={view.match}
        category={view.category}
        score={view.score}
        periods={statistics.periodScores}
      />
      <section className={st.team} aria-labelledby={teamHeading}>
        <div className={st.heading}>
          <div className={st.headingCopy}>
            <h2 id={teamHeading}>{statisticsText("teamTitle")}</h2>
            <span>{view.match.teamNameAtMatch}</span>
          </div>
          <MatchPeriodFilter
            periods={view.match.periods}
            value={period}
            onChange={setPeriod}
          />
        </div>
        <TeamStatistics statistics={statistics.team} />
        <div ref={analysisRef} className={st.analysisAnchor}>
          <MatchEventAnalysis
            id={analysisId}
            snapshot={view}
            events={view.events}
            period={period}
            selectedPlayerId={selectedPlayerId}
            onClearPlayer={() => setSelectedPlayerId(undefined)}
            onSelectPlayer={selectPlayer}
          />
        </div>
        <MatchTimeoutStatistics
          ownTeam={view.match.teamNameAtMatch}
          opponentTeam={view.match.opponentName}
          timeouts={statistics.team.timeouts}
          periodLabel={periodLabel}
        />
      </section>
      <PlayerStatistics
        statistics={statistics.players.filter(
          (row) => row.player.role === "field-player",
        )}
        team={statistics.team}
        periodLabel={periodLabel}
        selectedPlayerId={selectedPlayerId}
        onSelectPlayer={selectPlayer}
        onViewPlayer={viewPlayer}
        analysisId={analysisId}
      />
      <GoalkeeperStatistics
        statistics={statistics.players}
        unattributedConcededGoals={statistics.team.unattributedConcededGoals}
        periodLabel={periodLabel}
        selectedPlayerId={selectedPlayerId}
        onSelectPlayer={selectPlayer}
        analysisId={analysisId}
      />
    </div>
  );
}
