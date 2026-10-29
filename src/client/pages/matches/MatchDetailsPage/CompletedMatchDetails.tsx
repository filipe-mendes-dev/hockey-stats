"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { createMatchStatisticsView } from "../../../../domain/matches/matchStatisticsView";
import { DeleteEntityAction } from "../../../features/removal/DeleteEntityAction/DeleteEntityAction";
import { BackLink } from "../../../components/BackLink/BackLink";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { DeliveryStatus } from "../../../features/sync/DeliveryStatus/DeliveryStatus";
import { useMatchEvents } from "../../../features/matches/queries/matchEvents.queries";
import { useTeam } from "../../../features/teams/queries/teams.queries";
import { MatchResult } from "../../../features/matches/MatchResult/MatchResult";
import { CompletedMatchStatistics } from "../../../features/statistics/CompletedMatchStatistics/CompletedMatchStatistics";
import type { CompletedMatchDetailsProps } from "./CompletedMatchDetails.interfaces";
import st from "./CompletedMatchDetails.module.css";

export function CompletedMatchDetails({
  snapshot,
}: CompletedMatchDetailsProps) {
  const t = useTranslations("matches");
  const recorder = useTranslations("recorder");
  const events = useMatchEvents(snapshot.match.id);
  const team = useTeam(snapshot.match.teamId);
  const view = useMemo(
    () =>
      events.data
        ? createMatchStatisticsView(snapshot, events.data, team.data?.category)
        : undefined,
    [snapshot, events.data, team.data?.category],
  );
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
      {view && !events.isError ? (
        <CompletedMatchStatistics view={view} />
      ) : (
        <>
          <MatchResult
            match={snapshot.match}
            category={team.data?.category}
            score={undefined}
            periods={undefined}
          />
          <EntityDataStatus
            loadingLabel={recorder("loading")}
            failedLabel={recorder("loadFailed")}
            retryLabel={recorder("retry")}
            failed={events.isError}
            onRetry={() => {
              void events.refetch();
            }}
          />
        </>
      )}
    </div>
  );
}
