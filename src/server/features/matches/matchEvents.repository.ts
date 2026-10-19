import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { DatabaseTransaction } from "../../db/client.ts";
import { matchSchema } from "../../../domain/matches/match.schema";
import { matchEventSchema } from "../../../domain/matches/matchEvent.schema";
import type { MatchEvent } from "../../../domain/matches/matchEvent.schema";
import { matchEvents } from "../../db/match_events_schema.ts";
import { matches } from "../../db/matches_schema.ts";

export function mapMatchEvent(
  row: typeof matchEvents.$inferSelect,
): MatchEvent {
  const { gameTimeMs, positionX, positionY, ...fields } = row;
  return matchEventSchema.parse({
    ...fields,
    gameTime: gameTimeMs === null ? undefined : { elapsedMs: gameTimeMs },
    position:
      positionX === null && positionY === null
        ? undefined
        : { x: positionX, y: positionY },
    deletedAt: row.deletedAt ?? undefined,
  });
}
function eventRow(event: MatchEvent): typeof matchEvents.$inferInsert {
  const { gameTime, position, ...fields } = event;
  return {
    ...fields,
    gameTimeMs: gameTime?.elapsedMs ?? null,
    positionX: position?.x ?? null,
    positionY: position?.y ?? null,
    deletedAt: event.deletedAt ?? null,
  };
}
export async function getOwnedMatchForUpdate(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  matchId: string,
) {
  const [row] = await transaction
    .select()
    .from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.ownerUserId, ownerUserId)))
    .for("update");
  return row
    ? matchSchema.parse({
        ...row,
        scheduledDate: row.scheduledDate ?? undefined,
        venueRole: row.venueRole ?? undefined,
        startedAt: row.startedAt ?? undefined,
      })
    : null;
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
