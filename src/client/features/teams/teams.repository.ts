import { teamSchema } from "../../../domain/teams/team.schema";
import type { Team } from "../../../domain/teams/team.schema";
import { getDatabase } from "../../storage/database";

export async function listTeams(): Promise<Team[]> {
  const database = await getDatabase();
  const rows = await database.table<unknown, string>("teams").toArray();
  return rows
    .map((row) => teamSchema.parse(row))
    .filter((team) => team.archivedAt === undefined);
}

export async function getTeamById(id: string): Promise<Team | null> {
  if (!teamSchema.shape.id.safeParse(id).success) return null;
  const database = await getDatabase();
  const row: unknown = await database.table<unknown, string>("teams").get(id);
  return row === undefined ? null : teamSchema.parse(row);
}

export async function insertTeam(team: Team): Promise<void> {
  const database = await getDatabase();
  await database.table<Team, string>("teams").add(team);
}
