import "server-only";
import { eq } from "drizzle-orm";
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
    })
    .from(players)
    .where(eq(players.ownerUserId, ownerUserId));
  return rows;
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
