import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { MatchSnapshot } from "../../../../domain/matches/match.schema";
import type { MatchEvent } from "../../../../domain/matches/matchEvent.schema";
import { getEventDetail } from "../../../../domain/matches/matchEvent.schema";
import { deriveChronologicalMatchState } from "../../../../domain/matches/derivedMatchState";
import { getMatchEventsThroughEvent } from "../../../../domain/matches/matchEventOrder";
import {
  formatCountdown,
  formatMatchTime,
} from "../../../../domain/matches/matchControl";
import type { MatchEventDescription } from "./MatchEventAnalysis.interfaces";

export function useEventDescriptions(
  snapshot: MatchSnapshot,
  events: readonly MatchEvent[],
) {
  const t = useTranslations("statistics");
  const recorder = useTranslations("recorder");
  const matches = useTranslations("matches");
  return useMemo(() => {
    function playerName(playerId: string | undefined): string {
      const player = snapshot.players.find((entry) => entry.id === playerId);
      return player
        ? `${player.jerseyNumber ? `#${player.jerseyNumber} ` : ""}${player.playerNameAtMatch}`
        : recorder("playerUnavailable");
    }

    function describe(event: MatchEvent): MatchEventDescription {
      const participant =
        event.kind === "substitution"
          ? recorder("substitutionPlayers", {
              outgoing: playerName(event.outgoingMatchPlayerId),
              incoming: playerName(event.incomingMatchPlayerId),
            })
          : "matchPlayerId" in event
            ? playerName(event.matchPlayerId)
            : event.kind === "opponent-goal"
              ? snapshot.match.opponentName
              : snapshot.match.teamNameAtMatch;
      const detail = getEventDetail(event);
      const parts = [
        recorder("eventSummary", {
          kind: recorder(event.kind),
          detail: detail
            ? recorder(detail)
            : event.kind === "score-adjustment"
              ? recorder("scoreChange", {
                  own: event.ownDelta,
                  opponent: event.opponentDelta,
                })
              : "",
        }).trim(),
      ];
      if (
        event.kind === "shot" &&
        event.attemptType &&
        event.attemptType !== "open-play"
      )
        parts.push(recorder(event.attemptType), recorder("restartSpot"));
      if (event.kind === "ball-recovery" || event.kind === "ball-loss")
        parts.push(recorder(event.rinkHalf ?? "locationUnknown"));
      if (event.kind === "powerplay-adjust")
        parts.push(
          recorder("penaltyAdjustedTo", {
            time: formatMatchTime(event.powerplayDurationMs),
          }),
        );
      if (event.kind === "card") {
        if (event.removedMatchPlayerId)
          parts.push(
            recorder("outgoingPlayer", {
              name: playerName(event.removedMatchPlayerId),
            }),
          );
        if (event.lineupEffect === "replace")
          parts.push(
            recorder("incomingPlayer", {
              name: playerName(event.replacementMatchPlayerId),
            }),
          );
        if (
          event.colour === "blue" &&
          event.startsPowerplay &&
          (deriveChronologicalMatchState(
            snapshot,
            getMatchEventsThroughEvent(events, event),
          ).blueCardCounts.get(event.matchPlayerId) ?? 0) >= 3
        )
          parts.push(recorder("thirdBlueRed"));
      }
      const action = parts.join(" · ");
      const duration = snapshot.match.periods.find(
        (entry) => entry.number === event.period,
      )?.durationMs;
      const countdown = formatCountdown(event.gameTime?.elapsedMs, duration);
      const time =
        countdown ??
        (event.gameTime
          ? formatMatchTime(event.gameTime.elapsedMs)
          : recorder("untimed"));
      const periodName = matches("periodLabel", { number: event.period });
      const context = event.gameTime
        ? t(countdown === undefined ? "elapsed" : "remaining", {
            period: periodName,
            time,
          })
        : recorder("eventTime", { period: event.period, time });
      const positioned = "position" in event && event.position !== undefined;
      return {
        participant,
        action,
        time,
        periodName,
        context,
        positioned,
        elapsed: countdown === undefined && event.gameTime !== undefined,
        label: t(
          positioned ? "eventDescription" : "eventDescriptionNoPosition",
          { participant, action, time: context },
        ),
      };
    }

    return new Map(
      events
        .filter((event) => event.deletedAt === undefined)
        .map((event) => [event.id, describe(event)]),
    );
  }, [events, snapshot, t, recorder, matches]);
}
