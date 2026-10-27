import { randomUUID } from "node:crypto";
import { matchSnapshotSchema } from "../../../src/domain/matches/match.schema";
import type { MatchSnapshot } from "../../../src/domain/matches/match.schema";
import { matchEventSchema } from "../../../src/domain/matches/matchEvent.schema";
import type { MatchEvent } from "../../../src/domain/matches/matchEvent.schema";

export const minute = 60_000;
const epoch = 1_790_000_000_000;

export function createSnapshot(completed = false): MatchSnapshot {
  const matchId = randomUUID();
  return matchSnapshotSchema.parse({
    match: {
      id: matchId,
      teamId: randomUUID(),
      teamNameAtMatch: "Our team",
      opponentName: "Opponent",
      status: completed ? "completed" : "live",
      currentPeriod: completed ? 2 : 1,
      periods: [
        { number: 1, durationMs: 20 * minute, attackDirection: "toward-x1" },
        { number: 2, durationMs: 20 * minute, attackDirection: "toward-x0" },
      ],
      closedPeriods: completed
        ? [
            { number: 1, elapsedMs: 20 * minute },
            { number: 2, elapsedMs: 20 * minute },
          ]
        : [],
      clock: { elapsedMs: completed ? 20 * minute : 12 * minute },
      revision: 20,
      createdAt: epoch,
      startedAt: epoch,
      updatedAt: epoch + 60 * minute,
      ...(completed ? { completedAt: epoch + 60 * minute } : {}),
    },
    players: ["A", "B", "C", "D", "Keeper", "E", "F", "Reserve keeper"].map(
      (name, index) => ({
        id: randomUUID(),
        matchId,
        playerId: randomUUID(),
        playerNameAtMatch: name,
        role: index === 4 || index === 7 ? "goalkeeper" : "field-player",
        isStarter: index < 5,
      }),
    ),
  });
}

export function playerId(snapshot: MatchSnapshot, name: string): string {
  const player = snapshot.players.find(
    (entry) => entry.playerNameAtMatch === name,
  );
  if (!player) throw new Error(`Missing fixture player ${name}`);
  return player.id;
}

export function createEvent(
  snapshot: MatchSnapshot,
  order: number,
  elapsedMinutes: number | undefined,
  fields: Record<string, unknown>,
  period = 1,
): MatchEvent {
  return matchEventSchema.parse({
    id: randomUUID(),
    matchId: snapshot.match.id,
    order,
    period,
    revision: 1,
    capturedAt: epoch + order * 1000,
    createdAt: epoch + order * 1000,
    updatedAt: epoch + order * 1000,
    ...(elapsedMinutes === undefined
      ? {}
      : { gameTime: { elapsedMs: elapsedMinutes * minute } }),
    ...fields,
  });
}

export function substitution(
  snapshot: MatchSnapshot,
  order: number,
  time: number,
  outgoing = "A",
  incoming = "E",
  period = 1,
): MatchEvent {
  return createEvent(
    snapshot,
    order,
    time,
    {
      kind: "substitution",
      outgoingMatchPlayerId: playerId(snapshot, outgoing),
      incomingMatchPlayerId: playerId(snapshot, incoming),
    },
    period,
  );
}

export function shot(
  snapshot: MatchSnapshot,
  order: number,
  time: number | undefined,
  player = "B",
  period = 1,
): MatchEvent {
  return createEvent(
    snapshot,
    order,
    time,
    {
      kind: "shot",
      matchPlayerId: playerId(snapshot, player),
      outcome: "goal",
      attemptType: "open-play",
    },
    period,
  );
}

export function card(
  snapshot: MatchSnapshot,
  order: number,
  time: number,
  colour: "blue" | "red" = "blue",
): MatchEvent {
  return createEvent(snapshot, order, time, {
    kind: "card",
    matchPlayerId: playerId(snapshot, "A"),
    colour,
    lineupEffect: "remove",
    removedMatchPlayerId: playerId(snapshot, "A"),
    startsPowerplay: true,
    powerplayDurationMs: colour === "blue" ? 2 * minute : 4 * minute,
  });
}
