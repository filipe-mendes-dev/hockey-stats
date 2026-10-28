"use client";

import { DeleteEntityAction } from "../../../features/removal/DeleteEntityAction/DeleteEntityAction";
import { useId, useMemo, useRef, useState } from "react";
import { MatchPeriodFilter } from "../../../features/statistics/MatchPeriodFilter/MatchPeriodFilter";
import { useTranslations } from "next-intl";
import { deriveMatchState } from "../../../../domain/matches/derivedMatchState";
import { getMatchStatistics } from "../../../../domain/matches/matchStatistics";
import { BackLink } from "../../../components/BackLink/BackLink";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { DeliveryStatus } from "../../../features/sync/DeliveryStatus/DeliveryStatus";
import { useMatchEvents } from "../../../features/matches/queries/matchEvents.queries";
import { useTeam } from "../../../features/teams/queries/teams.queries";
import { MatchResult } from "../../../features/matches/MatchResult/MatchResult";
import { TeamStatistics } from "../../../features/statistics/TeamStatistics/TeamStatistics";
import { MatchTimeoutStatistics } from "../../../features/statistics/MatchTimeoutStatistics/MatchTimeoutStatistics";
import { MatchEventAnalysis } from "../../../features/statistics/MatchEventAnalysis/MatchEventAnalysis";
import { PlayerStatistics } from "../../../features/statistics/PlayerStatistics/PlayerStatistics";
import { GoalkeeperStatistics } from "../../../features/statistics/GoalkeeperStatistics/GoalkeeperStatistics";
import type { CompletedMatchDetailsProps } from "./CompletedMatchDetails.interfaces";
import st from "./CompletedMatchDetails.module.css";

export function CompletedMatchDetails({
  snapshot,
}: CompletedMatchDetailsProps) {
  const t = useTranslations("matches");
  const statisticsText = useTranslations("statistics");
  const recorder = useTranslations("recorder");
  const events = useMatchEvents(snapshot.match.id);
  const team = useTeam(snapshot.match.teamId);
  const [period, setPeriod] = useState<number>();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>();
  const analysisId = useId();
  const teamHeading = useId();
  const analysisRef = useRef<HTMLDivElement>(null);
  const statistics = useMemo(
    () =>
      events.data
        ? getMatchStatistics(snapshot, events.data, period)
        : undefined,
    [snapshot, events.data, period],
  );
  const score = useMemo(() => {
    if (!events.data) return undefined;
    const state = deriveMatchState(snapshot, events.data);
    return { own: state.ownScore, opponent: state.opponentScore };
  }, [snapshot, events.data]);
  const ready =
    !events.isPending && !events.isError && statistics && events.data;
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
      <div className={st.navigation}>
        <BackLink href="/app/matches" label={t("back")} />
        <div className={st.deliveryActions}>
          <DeleteEntityAction
            target={{
              feature: "matches",
              id: snapshot.match.id,
              expectedRevision: snapshot.match.revision,
              name: `${snapshot.match.teamNameAtMatch} · ${snapshot.match.opponentName}`,
            }}
            redirectHref="/app/matches"
          />
          <DeliveryStatus
            compact
            kind="match.create"
            entityId={snapshot.match.id}
          />
        </div>
      </div>
      <MatchResult
        match={snapshot.match}
        category={team.data?.category}
        score={events.isError ? undefined : score}
        periods={events.isError ? undefined : statistics?.periodScores}
      />
      {!ready ? (
        <EntityDataStatus
          loadingLabel={recorder("loading")}
          failedLabel={recorder("loadFailed")}
          retryLabel={recorder("retry")}
          failed={events.isError}
          onRetry={() => {
            void events.refetch();
          }}
        />
      ) : (
        <>
          <section className={st.team} aria-labelledby={teamHeading}>
            <div className={st.heading}>
              <div className={st.headingCopy}>
                <h2 id={teamHeading}>{statisticsText("teamTitle")}</h2>
                <span>{snapshot.match.teamNameAtMatch}</span>
              </div>
              <MatchPeriodFilter
                periods={snapshot.match.periods}
                value={period}
                onChange={setPeriod}
              />
            </div>
            <TeamStatistics statistics={statistics.team} />
            <div ref={analysisRef} className={st.analysisAnchor}>
              <MatchEventAnalysis
                id={analysisId}
                snapshot={snapshot}
                events={events.data}
                period={period}
                selectedPlayerId={selectedPlayerId}
                onClearPlayer={() => setSelectedPlayerId(undefined)}
                onSelectPlayer={selectPlayer}
              />
            </div>
            <MatchTimeoutStatistics
              ownTeam={snapshot.match.teamNameAtMatch}
              opponentTeam={snapshot.match.opponentName}
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
            unattributedConcededGoals={
              statistics.team.unattributedConcededGoals
            }
            periodLabel={periodLabel}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={selectPlayer}
            analysisId={analysisId}
          />
        </>
      )}
    </div>
  );
}
