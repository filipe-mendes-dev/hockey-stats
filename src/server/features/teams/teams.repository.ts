import "server-only";
import { eq } from "drizzle-orm";
import type { Team } from "../../../domain/teams/team.schema";
import { db } from "../../db/client.ts";
import type { DatabaseTransaction } from "../../db/client.ts";
import { teams } from "../../db/teams_schema.ts";

export async function listTeamsForOwner(ownerUserId: string): Promise<Team[]> {
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      category: teams.category,
      season: teams.season,
      revision: teams.revision,
      createdAt: teams.createdAt,
      updatedAt: teams.updatedAt,
    })
    .from(teams)
    .where(eq(teams.ownerUserId, ownerUserId));
  return rows.map((row) => ({
    ...row,
    category: row.category ?? undefined,
    season: row.season ?? undefined,
  }));
}

export async function insertTeam(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  team: Team,
): Promise<boolean> {
  const rows = await transaction
    .insert(teams)
    .values({
      id: team.id,
      ownerUserId,
      name: team.name,
      category: team.category ?? null,
      season: team.season ?? null,
      revision: team.revision,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    })
    .onConflictDoNothing({ target: teams.id })
    .returning({ id: teams.id });
  return rows.length === 1;
}
