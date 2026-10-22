import { playerSchema } from "../../../domain/players/player.schema";
import type { Player } from "../../../domain/players/player.schema";
import { getDatabase } from "../../storage/database";

export async function listStoredPlayers(): Promise<Player[]> {
  const database = await getDatabase();
  const records = await database.table<unknown, string>("players").toArray();
  return records.map((record) => playerSchema.parse(record));
}

export async function listPlayers(): Promise<Player[]> {
  return (await listStoredPlayers()).filter(
    (player) => player.archivedAt === undefined,
  );
}

export async function getPlayerById(id: string): Promise<Player | null> {
  if (!playerSchema.shape.id.safeParse(id).success) return null;
  const database = await getDatabase();
  const record: unknown = await database
    .table<unknown, string>("players")
    .get(id);
  return record === undefined ? null : playerSchema.parse(record);
}

export async function insertPlayer(player: Player): Promise<void> {
  const database = await getDatabase();
  await database.table<Player, string>("players").add(player);
}

export async function putPlayer(player: Player): Promise<void> {
  const database = await getDatabase();
  await database.table<Player, string>("players").put(player);
}

export async function updatePlayerRecord(player: Player): Promise<void> {
  const database = await getDatabase();
  if (
    (await database
      .table<Player, string>("players")
      .update(player.id, player)) !== 1
  )
    throw new Error("Player unavailable.");
}
