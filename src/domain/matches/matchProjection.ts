import type { MatchSnapshot } from "./match.schema";
import type { MatchEvent } from "./matchEvent.schema";
export interface MatchProjection {
  activePlayerIds: Set<string>;
  ownScore: number;
  opponentScore: number;
  valid: boolean;
}
export function projectMatch(
  snapshot: MatchSnapshot,
  events: readonly MatchEvent[],
): MatchProjection {
  const result: MatchProjection = {
    activePlayerIds: new Set(
      snapshot.players
        .filter((player) => player.isStarter)
        .map((player) => player.id),
    ),
    ownScore: 0,
    opponentScore: 0,
    valid: true,
  };
  for (const event of [...events].sort((a, b) => a.order - b.order)) {
    if (event.deletedAt !== undefined) continue;
    switch (event.kind) {
      case "player-in":
        if (result.activePlayerIds.has(event.matchPlayerId))
          result.valid = false;
        result.activePlayerIds.add(event.matchPlayerId);
        break;
      case "player-out":
        if (!result.activePlayerIds.delete(event.matchPlayerId))
          result.valid = false;
        break;
      case "shot":
        if (event.outcome === "goal") result.ownScore += 1;
        break;
      case "opponent-goal":
        result.opponentScore += 1;
        break;
      case "score-adjustment":
        result.ownScore += event.ownDelta;
        result.opponentScore += event.opponentDelta;
        break;
    }
    if (
      !Number.isSafeInteger(result.ownScore) ||
      !Number.isSafeInteger(result.opponentScore) ||
      result.ownScore < 0 ||
      result.opponentScore < 0
    )
      result.valid = false;
  }
  return result;
}
export function isValidEventForMatch(
  snapshot: MatchSnapshot,
  event: MatchEvent,
): boolean {
  const period = snapshot.match.periods.find(
    (entry) => entry.number === event.period,
  );
  return (
    event.matchId === snapshot.match.id &&
    period !== undefined &&
    (!("matchPlayerId" in event) ||
      snapshot.players.some((player) => player.id === event.matchPlayerId)) &&
    (event.gameTime === undefined ||
      period.durationMs === undefined ||
      event.gameTime.elapsedMs <= period.durationMs)
  );
}
