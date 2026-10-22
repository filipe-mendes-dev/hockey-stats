import { teamPlayerSchema } from "../../../domain/teams/teamPlayer.schema";
import type { TeamPlayer } from "../../../domain/teams/teamPlayer.schema";
import { getDatabase } from "../../storage/database";
export async function listTeamPlayers(teamId: string): Promise<TeamPlayer[]> {
  const database = await getDatabase();
  return (
    await database
      .table<unknown, string>("teamPlayers")
      .where("teamId")
      .equals(teamId)
      .toArray()
  ).map((row) => teamPlayerSchema.parse(row));
}
export async function listTeamPlayersByPlayer(
  playerId: string,
): Promise<TeamPlayer[]> {
  if (!teamPlayerSchema.shape.playerId.safeParse(playerId).success) return [];
  const database = await getDatabase();
  const rows = await database
    .table<unknown, string>("teamPlayers")
    .where("playerId")
    .equals(playerId)
    .toArray();
  return rows.map((row) => teamPlayerSchema.parse(row));
}

export async function getTeamPlayer(id: string): Promise<TeamPlayer | null> {
  const database = await getDatabase();
  const row = await database.table<unknown, string>("teamPlayers").get(id);
  return row === undefined ? null : teamPlayerSchema.parse(row);
}
export async function insertTeamPlayer(membership: TeamPlayer): Promise<void> {
  const database = await getDatabase();
  await database.table<TeamPlayer, string>("teamPlayers").add(membership);
}
export async function updateTeamPlayerRecord(
  membership: TeamPlayer,
): Promise<void> {
  const database = await getDatabase();
  if (
    (await database
      .table<TeamPlayer, string>("teamPlayers")
      .update(membership.id, membership)) !== 1
  )
    throw new Error("Membership unavailable.");
}

export async function deleteTeamPlayerRecord(id: string): Promise<void> {
  const database = await getDatabase();
  await database.table<TeamPlayer, string>("teamPlayers").delete(id);
}
