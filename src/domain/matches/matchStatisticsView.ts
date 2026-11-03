import {
  matchStatisticsViewSchema,
  statisticsEventSchema,
  statisticsPlayerSchema,
} from "../../contracts/match-statistics-view.schema";
import type {
  StatisticsEvent,
  MatchStatisticsView,
} from "../../contracts/match-statistics-view.schema";
import type { MatchSnapshot } from "./match.schema";
import type { MatchEvent } from "./matchEvent.schema";
import {
  deriveMatchState,
  deriveChronologicalMatchState,
} from "./derivedMatchState";
import { getMatchEventsThroughEvent, sortMatchEvents } from "./matchEventOrder";
import { getMatchStatistics } from "./matchStatistics";
import { deriveTeamLineupTimeline } from "./lineupTimeline";

function presentEvent(
  snapshot: MatchSnapshot,
  events: readonly MatchEvent[],
  event: MatchEvent,
): StatisticsEvent {
  const preceding =
    event.kind === "card" ? getMatchEventsThroughEvent(events, event) : [];
  const onRink =
    event.kind !== "card" ||
    deriveChronologicalMatchState(
      snapshot,
      preceding.slice(0, -1),
      event,
    ).activePlayerIds.has(event.matchPlayerId);
  const thirdBlueRed =
    event.kind === "card" &&
    event.colour === "blue" &&
    Boolean(event.startsPowerplay) &&
    (deriveChronologicalMatchState(snapshot, preceding).blueCardCounts.get(
      event.matchPlayerId,
    ) ?? 0) >= 3;
  const base = {
    id: event.id,
    order: event.order,
    period: event.period,
    ...(event.gameTime ? { gameTime: event.gameTime } : {}),
    onRink,
    thirdBlueRed,
  };
  const player =
    "matchPlayerId" in event && event.matchPlayerId
      ? { matchPlayerId: event.matchPlayerId }
      : {};
  const spatial =
    "position" in event && event.position ? { position: event.position } : {};
  let detail: object;
  switch (event.kind) {
    case "ball-recovery":
      detail = { subtype: event.subtype, rinkHalf: event.rinkHalf };
      break;
    case "ball-loss":
      detail = { reason: event.reason, rinkHalf: event.rinkHalf };
      break;
    case "shot":
      detail = { outcome: event.outcome, attemptType: event.attemptType };
      break;
    case "card":
      detail = {
        colour: event.colour,
        lineupEffect: event.lineupEffect,
        removedMatchPlayerId: event.removedMatchPlayerId,
        replacementMatchPlayerId: event.replacementMatchPlayerId,
      };
      break;
    case "substitution":
      detail = {
        incomingMatchPlayerId: event.incomingMatchPlayerId,
        outgoingMatchPlayerId: event.outgoingMatchPlayerId,
      };
      break;
    case "powerplay-adjust":
      detail = { powerplayDurationMs: event.powerplayDurationMs };
      break;
    case "score-adjustment":
      detail = { ownDelta: event.ownDelta, opponentDelta: event.opponentDelta };
      break;
    case "goalkeeper-save":
      detail = { difficulty: event.difficulty };
      break;
    case "timeout":
      detail = { team: event.team };
      break;
    default:
      detail = {};
  }
  return statisticsEventSchema.parse({
    ...base,
    kind: event.kind,
    ...player,
    ...spatial,
    ...detail,
  });
}

export function createMatchStatisticsView(
  snapshot: MatchSnapshot,
  events: readonly MatchEvent[],
  category?: string,
): MatchStatisticsView {
  const { match } = snapshot;
  const active = sortMatchEvents(events);
  const state = deriveMatchState(snapshot, events);
  return matchStatisticsViewSchema.parse({
    match: {
      teamNameAtMatch: match.teamNameAtMatch,
      opponentName: match.opponentName,
      scheduledDate: match.scheduledDate,
      venueRole: match.venueRole,
      status: match.status,
      periods: match.periods,
    },
    players: snapshot.players.map((player) =>
      statisticsPlayerSchema.parse(player),
    ),
    category,
    score: { own: state.ownScore, opponent: state.opponentScore },
    statistics: [
      undefined,
      ...match.periods.map((period) => period.number),
    ].map((period) => {
      const values = getMatchStatistics(snapshot, events, period);
      return {
        period,
        values: {
          ...values,
          players: values.players.map((row) => ({
            ...row,
            player: statisticsPlayerSchema.parse(row.player),
          })),
        },
      };
    }),
    events: active.map((event) => presentEvent(snapshot, events, event)),
    timelines: deriveTeamLineupTimeline(snapshot, events).map((timeline) => ({
      period: timeline.period,
      extentMs: timeline.extentMs,
      unknownFromMs: timeline.unknownFromMs,
      stints: timeline.stints.map((stint) => ({
        matchPlayerId: stint.matchPlayerId,
        startMs: stint.startMs,
        endMs: stint.endMs,
        lane: stint.lane,
      })),
      issue: timeline.issue
        ? {
            reason: timeline.issue.reason,
            event: timeline.issue.event
              ? {
                  period: timeline.issue.event.period,
                  order: timeline.issue.event.order,
                  gameTime: timeline.issue.event.gameTime,
                }
              : undefined,
          }
        : undefined,
    })),
  });
}
