import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { DatabaseTransaction } from "../../db/client.ts";
import { matchEventSchema } from "../../../domain/matches/matchEvent.schema";
import type { MatchEvent } from "../../../domain/matches/matchEvent.schema";
import { matchEvents } from "../../db/match_events_schema.ts";
import { matches } from "../../db/matches_schema.ts";

export function mapMatchEvent(
  row: typeof matchEvents.$inferSelect,
): MatchEvent {
  const {
    gameTimeMs,
    positionX,
    positionY,
    matchPlayerId,
    outgoingMatchPlayerId,
    incomingMatchPlayerId,
    replacementMatchPlayerId,
    lineupEffect,
    startsPowerplay,
    powerplayDurationMs,
    removedMatchPlayerId,
    powerplayCardEventId,
    entryReason,
    subtype,
    reason,
    rinkHalf,
    outcome,
    colour,
    ownDelta,
    opponentDelta,
    deletedAt,
    ...fields
  } = row;
  return matchEventSchema.parse({
    ...fields,
    ...(matchPlayerId === null ? {} : { matchPlayerId }),
    ...(outgoingMatchPlayerId === null ? {} : { outgoingMatchPlayerId }),
    ...(incomingMatchPlayerId === null ? {} : { incomingMatchPlayerId }),
    ...(replacementMatchPlayerId === null ? {} : { replacementMatchPlayerId }),
    ...(lineupEffect === null ? {} : { lineupEffect }),
    ...(startsPowerplay === null ? {} : { startsPowerplay }),
    ...(powerplayDurationMs === null ? {} : { powerplayDurationMs }),
    ...(removedMatchPlayerId === null ? {} : { removedMatchPlayerId }),
    ...(powerplayCardEventId === null ? {} : { powerplayCardEventId }),
    ...(entryReason === null ? {} : { entryReason }),
    ...(subtype === null ? {} : { subtype }),
    ...(reason === null ? {} : { reason }),
    ...(rinkHalf === null ? {} : { rinkHalf }),
    ...(outcome === null ? {} : { outcome }),
    ...(colour === null ? {} : { colour }),
    ...(ownDelta === null ? {} : { ownDelta }),
    ...(opponentDelta === null ? {} : { opponentDelta }),
    ...(gameTimeMs === null ? {} : { gameTime: { elapsedMs: gameTimeMs } }),
    ...(positionX === null && positionY === null
      ? {}
      : { position: { x: positionX, y: positionY } }),
    deletedAt: deletedAt ?? undefined,
  });
}
function eventRow(event: MatchEvent): typeof matchEvents.$inferInsert {
  return {
    id: event.id,
    matchId: event.matchId,
    kind: event.kind,
    period: event.period,
    order: event.order,
    capturedAt: event.capturedAt,
    revision: event.revision,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    deletedAt: event.deletedAt ?? null,
    matchPlayerId: "matchPlayerId" in event ? event.matchPlayerId : null,
    outgoingMatchPlayerId:
      event.kind === "substitution" ? event.outgoingMatchPlayerId : null,
    incomingMatchPlayerId:
      event.kind === "substitution" ? event.incomingMatchPlayerId : null,
    replacementMatchPlayerId:
      event.kind === "card" ? (event.replacementMatchPlayerId ?? null) : null,
    lineupEffect: event.kind === "card" ? (event.lineupEffect ?? null) : null,
    startsPowerplay:
      event.kind === "card" ? (event.startsPowerplay ?? null) : null,
    removedMatchPlayerId:
      event.kind === "card" ? (event.removedMatchPlayerId ?? null) : null,
    powerplayCardEventId:
      event.kind === "powerplay-end" || event.kind === "powerplay-adjust"
        ? event.powerplayCardEventId
        : null,
    powerplayDurationMs:
      "powerplayDurationMs" in event
        ? (event.powerplayDurationMs ?? null)
        : null,
    entryReason:
      event.kind === "player-in" ? (event.entryReason ?? null) : null,
    subtype: "subtype" in event ? event.subtype : null,
    reason: "reason" in event ? event.reason : null,
    rinkHalf: "rinkHalf" in event ? (event.rinkHalf ?? null) : null,
    outcome: "outcome" in event ? event.outcome : null,
    colour: "colour" in event ? event.colour : null,
    ownDelta: "ownDelta" in event ? event.ownDelta : null,
    opponentDelta: "opponentDelta" in event ? event.opponentDelta : null,
    gameTimeMs: event.gameTime?.elapsedMs ?? null,
    positionX: "position" in event ? (event.position?.x ?? null) : null,
    positionY: "position" in event ? (event.position?.y ?? null) : null,
  };
}
export async function listMatchEvents(
  transaction: DatabaseTransaction,
  matchId: string,
): Promise<MatchEvent[]> {
  const rows = await transaction
    .select()
    .from(matchEvents)
    .where(eq(matchEvents.matchId, matchId))
    .orderBy(matchEvents.order);
  return rows.map(mapMatchEvent);
}
export async function listOwnedMatchEvents(
  transaction: DatabaseTransaction,
  ownerUserId: string,
): Promise<MatchEvent[]> {
  const rows = await transaction
    .select({ event: matchEvents })
    .from(matchEvents)
    .innerJoin(matches, eq(matches.id, matchEvents.matchId))
    .where(eq(matches.ownerUserId, ownerUserId));
  return rows.map((row) => mapMatchEvent(row.event));
}
export async function insertMatchEvent(
  transaction: DatabaseTransaction,
  event: MatchEvent,
): Promise<boolean> {
  const rows = await transaction
    .insert(matchEvents)
    .values(eventRow(event))
    .onConflictDoNothing()
    .returning({ id: matchEvents.id });
  return rows.length === 1;
}
export async function updateMatchEvent(
  transaction: DatabaseTransaction,
  event: MatchEvent,
): Promise<boolean> {
  const rows = await transaction
    .update(matchEvents)
    .set({
      revision: event.revision,
      updatedAt: event.updatedAt,
      deletedAt: event.deletedAt ?? null,
    })
    .where(
      and(
        eq(matchEvents.id, event.id),
        eq(matchEvents.matchId, event.matchId),
        eq(matchEvents.revision, event.revision - 1),
      ),
    )
    .returning({ id: matchEvents.id });
  return rows.length === 1;
}
export async function updateMatchRevision(
  transaction: DatabaseTransaction,
  matchId: string,
  expectedRevision: number,
  updatedAt: number,
): Promise<boolean> {
  const rows = await transaction
    .update(matches)
    .set({ revision: sql`${matches.revision} + 1`, updatedAt })
    .where(
      and(
        eq(matches.id, matchId),
        eq(matches.revision, expectedRevision),
        eq(matches.status, "live"),
      ),
    )
    .returning({ id: matches.id });
  return rows.length === 1;
}
