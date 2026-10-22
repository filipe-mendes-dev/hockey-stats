import "server-only";
import { and, eq } from "drizzle-orm";
import type { DeletionFeature } from "../../../contracts/entity-deletions.schema";
import type { DatabaseTransaction } from "../../db/client.ts";
import {
  players,
  teams,
  teamPlayers,
  matches,
  matchEvents,
} from "../../db/schema.ts";

export async function getOwnedRemovalTarget(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  feature: DeletionFeature,
  id: string,
) {
  const table =
    feature === "players"
      ? players
      : feature === "teams"
        ? teams
        : feature === "matches"
          ? matches
          : teamPlayers;
  const [row] = await transaction
    .select({ revision: table.revision, updatedAt: table.updatedAt })
    .from(table)
    .where(and(eq(table.ownerUserId, ownerUserId), eq(table.id, id)))
    .for("update");
  return row ?? null;
}
export async function listOwnedRemovalMemberships(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  feature: "players" | "teams",
  id: string,
) {
  return transaction
    .select()
    .from(teamPlayers)
    .where(
      and(
        eq(teamPlayers.ownerUserId, ownerUserId),
        feature === "players"
          ? eq(teamPlayers.playerId, id)
          : eq(teamPlayers.teamId, id),
      ),
    )
    .for("update");
}
export async function archiveOwnedRecord(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  feature: "players" | "teams",
  id: string,
  revision: number,
  deletedAt: number,
): Promise<void> {
  const table = feature === "players" ? players : teams;
  await transaction
    .update(table)
    .set({ archivedAt: deletedAt, revision, updatedAt: deletedAt })
    .where(and(eq(table.ownerUserId, ownerUserId), eq(table.id, id)));
}
export async function deleteOwnedMembership(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  id: string,
): Promise<void> {
  await transaction
    .delete(teamPlayers)
    .where(
      and(eq(teamPlayers.ownerUserId, ownerUserId), eq(teamPlayers.id, id)),
    );
}
export async function deleteOwnedMatch(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  id: string,
): Promise<void> {
  // Remove the event graph before the call-up's restrictive references are checked.
  await transaction.delete(matchEvents).where(eq(matchEvents.matchId, id));
  await transaction
    .delete(matches)
    .where(and(eq(matches.ownerUserId, ownerUserId), eq(matches.id, id)));
}
