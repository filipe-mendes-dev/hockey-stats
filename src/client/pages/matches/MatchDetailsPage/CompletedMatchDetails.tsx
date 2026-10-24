"use client";

import { DeleteEntityAction } from "../../../features/removal/DeleteEntityAction/DeleteEntityAction";
import { useId, useMemo, useRef, useState } from "react";
import { SegmentedControl } from "@mantine/core";
import { useTranslations } from "next-intl";
import { deriveMatchState } from "../../../../domain/matches/derivedMatchState";
import { getMatchStatistics } from "../../../../domain/matches/matchStatistics";
import { BackLink } from "../../../components/BackLink/BackLink";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { DeliveryStatus } from "../../../features/sync/DeliveryStatus/DeliveryStatus";
import { useMatchEvents } from "../../../features/matches/queries/matchEvents.queries";
import { MatchResult } from "../../../features/matches/MatchResult/MatchResult";
import { TeamStatistics } from "../../../features/statistics/TeamStatistics/TeamStatistics";
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

  function selectPlayer(id: string): void {
    setSelectedPlayerId(selectedPlayerId === id ? undefined : id);
    if (selectedPlayerId !== id)
      analysisRef.current?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  }

  return (
    <div className={st.page}>
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
              <div>
                <h2 id={teamHeading}>{statisticsText("teamTitle")}</h2>
                <p>{snapshot.match.teamNameAtMatch}</p>
              </div>
              <SegmentedControl
                className={st.periods}
                fullWidth={false}
                aria-label={statisticsText("periodFilter")}
                value={period === undefined ? "all" : String(period)}
                onChange={(value) =>
                  setPeriod(
                    snapshot.match.periods.find(
                      (entry) => String(entry.number) === value,
                    )?.number,
                  )
                }
                data={[
                  { value: "all", label: statisticsText("allMatch") },
                  ...snapshot.match.periods.map((entry) => ({
                    value: String(entry.number),
                    label: t("periodLabel", { number: entry.number }),
                  })),
                ]}
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
              />
            </div>
          </section>
          <PlayerStatistics
            statistics={statistics.players.filter(
              (row) => row.player.role === "field-player",
            )}
            team={statistics.team}
            periodLabel={periodLabel}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={selectPlayer}
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
          <p className={st.readOnly}>{statisticsText("readOnly")}</p>
        </>
      )}
    </div>
  );
}
