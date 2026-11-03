import type { MatchSnapshot } from "./match.schema";
import { getPlayingTime } from "./powerplay";
import type { PowerplayPenalty } from "./powerplay";
import type { MatchEvent } from "./matchEvent.schema";
import { sortMatchEvents } from "./matchEventOrder";
import type { MatchEventTime } from "./matchEventOrder";
export interface DerivedMatchState {
  activePlayerIds: ReadonlySet<string>;
  ejectedPlayerIds: ReadonlySet<string>;
  blueCardCounts: ReadonlyMap<string, number>;
  powerplayCardEventIds: readonly string[];
  powerplays: readonly PowerplayPenalty[];
  lastPowerplayEndCardEventId: string | undefined;
  isPowerplay: boolean;
  maxOnField: 4 | 5;
  ownScore: number;
  opponentScore: number;
  valid: boolean;
}
export function deriveMatchState(
  snapshot: MatchSnapshot,
  events: readonly MatchEvent[],
  time?: MatchEventTime,
): DerivedMatchState {
  return replayMatchState(
    snapshot,
    [...events].sort((a, b) => a.order - b.order),
    time,
  );
}

export function deriveChronologicalMatchState(
  snapshot: MatchSnapshot,
  events: readonly MatchEvent[],
  time?: MatchEventTime,
): DerivedMatchState {
  return replayMatchState(snapshot, sortMatchEvents(events), time);
}

function replayMatchState(
  snapshot: MatchSnapshot,
  events: readonly MatchEvent[],
  time?: MatchEventTime,
): DerivedMatchState {
  const active = new Set(
    snapshot.players
      .filter((player) => player.isStarter)
      .map((player) => player.id),
  );
  const ejected = new Set<string>();
  const blueCardCounts = new Map<string, number>();
  interface PendingPenalty {
    cardEventId: string;
    colour: "blue" | "red";
    durationMs: number | undefined;
    capturedTime: number | undefined;
    endsAt?: number;
  }
  const penalties: PendingPenalty[] = [];
  let lastPowerplayEndCardEventId: string | undefined;
  function startCurrent(at: number | undefined): void {
    const current = penalties[0];
    if (current?.durationMs !== undefined && at !== undefined)
      current.endsAt =
        Math.max(at, current.capturedTime ?? at) + current.durationMs;
  }
  function finishCurrent(at: number | undefined): void {
    lastPowerplayEndCardEventId = penalties.shift()?.cardEventId;
    startCurrent(at);
  }
  function advance(at: number | undefined): void {
    if (at === undefined) return;
    while (penalties[0]?.endsAt !== undefined && penalties[0].endsAt <= at)
      finishCurrent(penalties[0].endsAt);
  }
  let ownScore = 0;
  let opponentScore = 0;
  let valid = true;
  for (const event of events) {
    if (event.deletedAt !== undefined) continue;
    const eventTime = getPlayingTime(
      snapshot.match,
      event.period,
      event.gameTime?.elapsedMs,
    );
    advance(eventTime);
    switch (event.kind) {
      case "player-in":
        if (
          active.has(event.matchPlayerId) ||
          (event.entryReason &&
            (ejected.has(event.matchPlayerId) ||
              penalties.length > 0 ||
              active.size !== 4))
        )
          valid = false;
        active.add(event.matchPlayerId);
        break;
      case "player-out":
        if (!active.delete(event.matchPlayerId)) valid = false;
        break;
      case "substitution":
        if (
          !active.has(event.outgoingMatchPlayerId) ||
          active.has(event.incomingMatchPlayerId) ||
          ejected.has(event.incomingMatchPlayerId)
        )
          valid = false;
        active.delete(event.outgoingMatchPlayerId);
        active.add(event.incomingMatchPlayerId);
        break;
      case "card": {
        if (event.colour === "blue")
          blueCardCounts.set(
            event.matchPlayerId,
            (blueCardCounts.get(event.matchPlayerId) ?? 0) + 1,
          );
        if (event.lineupEffect === undefined || event.colour === "yellow")
          break;
        if (
          event.colour === "red" ||
          (event.startsPowerplay &&
            (blueCardCounts.get(event.matchPlayerId) ?? 0) >= 3)
        )
          ejected.add(event.matchPlayerId);
        if (
          event.lineupEffect !== "none" &&
          !active.delete(event.removedMatchPlayerId ?? event.matchPlayerId)
        )
          valid = false;
        if (
          event.lineupEffect === "replace" &&
          event.replacementMatchPlayerId
        ) {
          if (
            active.has(event.replacementMatchPlayerId) ||
            ejected.has(event.replacementMatchPlayerId)
          )
            valid = false;
          active.add(event.replacementMatchPlayerId);
        }
        if (event.startsPowerplay) {
          penalties.push({
            cardEventId: event.id,
            colour: event.colour,
            durationMs: event.powerplayDurationMs,
            capturedTime: eventTime,
          });
          if (penalties.length === 1) startCurrent(eventTime);
        }
        break;
      }
      case "powerplay-end":
        if (penalties[0]?.cardEventId !== event.powerplayCardEventId)
          valid = false;
        else finishCurrent(eventTime);
        break;
      case "powerplay-adjust":
        if (penalties[0]?.cardEventId !== event.powerplayCardEventId)
          valid = false;
        else {
          penalties[0].durationMs = event.powerplayDurationMs;
          penalties[0].capturedTime = eventTime;
          startCurrent(eventTime);
        }
        break;
      case "suspension-end":
        break;
      case "shot":
        if (event.outcome === "goal") ownScore += 1;
        break;
      case "opponent-goal":
        opponentScore += 1;
        break;
      case "score-adjustment":
        ownScore += event.ownDelta;
        opponentScore += event.opponentDelta;
        break;
    }
    if (
      !Number.isSafeInteger(ownScore) ||
      !Number.isSafeInteger(opponentScore) ||
      ownScore < 0 ||
      opponentScore < 0
    )
      valid = false;
  }
  const currentTime = time
    ? getPlayingTime(snapshot.match, time.period, time.gameTime?.elapsedMs)
    : undefined;
  advance(currentTime);
  const powerplays = penalties.map((penalty, index) => ({
    cardEventId: penalty.cardEventId,
    colour: penalty.colour,
    remainingMs:
      index === 0 && penalty.endsAt !== undefined && currentTime !== undefined
        ? Math.max(0, penalty.endsAt - currentTime)
        : penalty.durationMs,
  }));
  const powerplayCardEventIds = penalties.map((penalty) => penalty.cardEventId);
  const isPowerplay = penalties.length > 0;
  return {
    activePlayerIds: active,
    ejectedPlayerIds: ejected,
    blueCardCounts,
    powerplayCardEventIds,
    powerplays,
    lastPowerplayEndCardEventId,
    isPowerplay,
    maxOnField: isPowerplay ? 4 : 5,
    ownScore,
    opponentScore,
    valid,
  };
}
