import type { MatchSnapshot } from "./match.schema";
import type { MatchEvent } from "./matchEvent.schema";
export interface DerivedMatchState {
  activePlayerIds: ReadonlySet<string>;
  ejectedPlayerIds: ReadonlySet<string>;
  blueCardCounts: ReadonlyMap<string, number>;
  powerplayCardEventIds: readonly string[];
  isPowerplay: boolean;
  maxOnField: 4 | 5;
  ownScore: number;
  opponentScore: number;
  valid: boolean;
}
export function deriveMatchState(
  snapshot: MatchSnapshot,
  events: readonly MatchEvent[],
): DerivedMatchState {
  const active = new Set(
    snapshot.players
      .filter((player) => player.isStarter)
      .map((player) => player.id),
  );
  const ejected = new Set<string>();
  const blueCardCounts = new Map<string, number>();
  const powerplayCardEventIds: string[] = [];
  let ownScore = 0;
  let opponentScore = 0;
  let valid = true;
  for (const event of [...events].sort((a, b) => a.order - b.order)) {
    if (event.deletedAt !== undefined) continue;
    switch (event.kind) {
      case "player-in":
        if (
          active.has(event.matchPlayerId) ||
          (event.entryReason &&
            (ejected.has(event.matchPlayerId) ||
              powerplayCardEventIds.length > 0 ||
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
        if (event.startsPowerplay) powerplayCardEventIds.push(event.id);
        break;
      }
      case "powerplay-end":
        if (powerplayCardEventIds[0] !== event.powerplayCardEventId)
          valid = false;
        else powerplayCardEventIds.shift();
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
  const isPowerplay = powerplayCardEventIds.length > 0;
  return {
    activePlayerIds: active,
    ejectedPlayerIds: ejected,
    blueCardCounts,
    powerplayCardEventIds,
    isPowerplay,
    maxOnField: isPowerplay ? 4 : 5,
    ownScore,
    opponentScore,
    valid,
  };
}
