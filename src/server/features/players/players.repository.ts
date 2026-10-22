import "server-only";
import { and, eq, lte, isNull } from "drizzle-orm";
import type { Player } from "../../../domain/players/player.schema";
import { db } from "../../db/client.ts";
import type { DatabaseTransaction } from "../../db/client.ts";
import { players } from "../../db/players_schema.ts";

export async function listPlayersForOwner(
  ownerUserId: string,
): Promise<Player[]> {
  const rows = await db
    .select({
      id: players.id,
      name: players.name,
      revision: players.revision,
      createdAt: players.createdAt,
      updatedAt: players.updatedAt,
      archivedAt: players.archivedAt,
    })
    .from(players)
    .where(eq(players.ownerUserId, ownerUserId));
  return rows.map((row) => ({
    ...row,
    archivedAt: row.archivedAt ?? undefined,
  }));
}

export async function insertPlayer(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  player: Player,
): Promise<boolean> {
  const rows = await transaction
    .insert(players)
    .values({
      id: player.id,
      ownerUserId,
      name: player.name,
      revision: player.revision,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
    })
    .onConflictDoNothing({ target: players.id })
    .returning({ id: players.id });
  return rows.length === 1;
}

export async function updatePlayer(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  player: Player,
  expectedRevision: number,
): Promise<boolean> {
  const rows = await transaction
    .update(players)
    .set({
      name: player.name,
      revision: player.revision,
      updatedAt: player.updatedAt,
    })
    .where(
      and(
        eq(players.id, player.id),
        eq(players.ownerUserId, ownerUserId),
        eq(players.revision, expectedRevision),
        eq(players.createdAt, player.createdAt),
        lte(players.updatedAt, player.updatedAt),
        isNull(players.archivedAt),
      ),
    )
    .returning({ id: players.id });
  return rows.length === 1;
}
