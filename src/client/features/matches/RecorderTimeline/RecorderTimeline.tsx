"use client";
import { useId, useState } from "react";
import { Button, Tooltip } from "@mantine/core";
import { useTranslations } from "next-intl";
import { getEventDetail } from "../../../../domain/matches/matchEvent.schema";
import { deriveMatchState } from "../../../../domain/matches/derivedMatchState";
import {
  formatMatchTime,
  formatCountdown,
} from "../../../../domain/matches/matchControl";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { DeliveryStatus } from "../../sync/DeliveryStatus/DeliveryStatus";
import { RecorderActionIcon } from "../RecorderBoard/RecorderActionIcon";
import { RecorderDialog } from "../RecorderDialog/RecorderDialog";
import type { RecorderTimelineProps } from "./RecorderTimeline.interfaces";
import st from "./RecorderTimeline.module.css";

export function RecorderTimeline({
  snapshot,
  events = [],
  loading,
  failed,
  onRetry,
  expanded = false,
  scrollable = false,
}: RecorderTimelineProps) {
  const t = useTranslations("recorder");
  const heading = useId();
  const [allOpen, setAllOpen] = useState(false);
  const count = events.filter((event) => !event.deletedAt).length;
  return (
    <section
      className={st.timeline}
      aria-labelledby={heading}
      data-scrollable={scrollable}
    >
      <div className={st.heading}>
        <h2 id={heading}>{t("timeline")}</h2>
        <span role="status" aria-label={t("eventCount", { count })}>
          {count}
        </span>
        {!expanded && count > 3 && (
          <Button
            className={st.all}
            size="sm"
            variant="subtle"
            onClick={() => setAllOpen(true)}
          >
            {t("allEvents")}
          </Button>
        )}
      </div>
      {loading || failed ? (
        <EntityDataStatus
          loadingLabel={t("loading")}
          failedLabel={t("loadFailed")}
          retryLabel={t("retry")}
          failed={failed}
          onRetry={onRetry}
        />
      ) : count === 0 ? (
        <p className={st.empty}>{t("empty")}</p>
      ) : (
        <ol className={st.events} data-expanded={expanded}>
          {[...events]
            .reverse()
            .filter((event) => event.deletedAt === undefined)
            .map((event) => {
              function playerName(id: string | undefined): string {
                return (
                  snapshot.players.find((player) => player.id === id)
                    ?.playerNameAtMatch ?? t("playerUnavailable")
                );
              }
              const participant =
                event.kind === "substitution"
                  ? t("substitutionPlayers", {
                      outgoing: playerName(event.outgoingMatchPlayerId),
                      incoming: playerName(event.incomingMatchPlayerId),
                    })
                  : "matchPlayerId" in event
                    ? playerName(event.matchPlayerId)
                    : t("matchLevelEvent");
              const detail = getEventDetail(event);
              const details = [
                t("eventSummary", {
                  kind: t(event.kind),
                  detail: detail
                    ? t(detail)
                    : event.kind === "score-adjustment"
                      ? t("scoreChange", {
                          own: event.ownDelta,
                          opponent: event.opponentDelta,
                        })
                      : "",
                }),
              ];
              if (
                event.kind === "shot" &&
                event.attemptType &&
                event.attemptType !== "open-play"
              )
                details.push(t(event.attemptType), t("restartSpot"));
              if (event.kind === "powerplay-adjust")
                details.push(
                  t("penaltyAdjustedTo", {
                    time: formatMatchTime(event.powerplayDurationMs),
                  }),
                );
              if (event.kind === "ball-recovery" || event.kind === "ball-loss")
                details.push(t(event.rinkHalf ?? "locationUnknown"));
              if (event.kind === "card") {
                if (event.removedMatchPlayerId)
                  details.push(
                    t("outgoingPlayer", {
                      name: playerName(event.removedMatchPlayerId),
                    }),
                  );
                if (
                  event.colour === "blue" &&
                  event.startsPowerplay &&
                  (deriveMatchState(
                    snapshot,
                    events.filter((entry) => entry.order <= event.order),
                  ).blueCardCounts.get(event.matchPlayerId) ?? 0) >= 3
                )
                  details.push(t("thirdBlueRed"));
                if (event.lineupEffect === "replace")
                  details.push(
                    t("incomingPlayer", {
                      name: playerName(event.replacementMatchPlayerId),
                    }),
                  );
              }
              const summary = details.join(" · ");
              const time =
                formatCountdown(
                  event.gameTime?.elapsedMs,
                  snapshot.match.periods.find(
                    (period) => period.number === event.period,
                  )?.durationMs,
                ) ?? t("untimed");
              const fullDescription = [
                participant,
                summary,
                t("eventTime", { period: event.period, time }),
              ].join(" · ");
              return (
                <li key={event.id}>
                  <span className={st.icon}>
                    <RecorderActionIcon kind={event.kind} size={15} />
                  </span>
                  <Tooltip
                    label={fullDescription}
                    multiline
                    events={{ hover: true, focus: true, touch: true }}
                    classNames={{ tooltip: st.detailsTooltip }}
                  >
                    <div
                      className={st.description}
                      tabIndex={0}
                      role="group"
                      aria-label={fullDescription}
                    >
                      <strong>{participant}</strong>
                      <div className={st.metadata}>
                        <span className={st.summary}>{summary}</span>
                        <span className={st.timestamp}>
                          <span>
                            {t("periodNumber", { number: event.period })}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className={st.time}>{time}</span>
                        </span>
                      </div>
                    </div>
                  </Tooltip>
                  <DeliveryStatus
                    compact
                    kind="matchEvent.create"
                    entityId={snapshot.match.id}
                    eventId={event.id}
                  />
                </li>
              );
            })}
        </ol>
      )}
      {allOpen && (
        <RecorderDialog title={t("timeline")} onClose={() => setAllOpen(false)}>
          <RecorderTimeline
            snapshot={snapshot}
            events={events}
            loading={loading}
            failed={failed}
            onRetry={onRetry}
            expanded
          />
        </RecorderDialog>
      )}
    </section>
  );
}
