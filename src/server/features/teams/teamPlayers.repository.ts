import "server-only";
import { and, eq, lte } from "drizzle-orm";
import type { TeamPlayer } from "../../../domain/teams/teamPlayer.schema";
import { db } from "../../db/client.ts";
import type { DatabaseTransaction } from "../../db/client.ts";
import { teamPlayers } from "../../db/team_players_schema.ts";
import { players } from "../../db/players_schema.ts";
import { teams } from "../../db/teams_schema.ts";
export async function listTeamPlayersForOwner(
  ownerUserId: string,
): Promise<TeamPlayer[]> {
  const rows = await db
    .select({
      id: teamPlayers.id,
      teamId: teamPlayers.teamId,
      playerId: teamPlayers.playerId,
      jerseyNumber: teamPlayers.jerseyNumber,
      role: teamPlayers.role,
      revision: teamPlayers.revision,
      createdAt: teamPlayers.createdAt,
      updatedAt: teamPlayers.updatedAt,
    })
    .from(teamPlayers)
    .where(eq(teamPlayers.ownerUserId, ownerUserId));
  return rows.map((row) => ({
    ...row,
    jerseyNumber: row.jerseyNumber ?? undefined,
  }));
}
export async function hasOwnedMembershipParents(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  membership: TeamPlayer,
): Promise<boolean> {
  const rows = await transaction
    .select({ id: teams.id })
    .from(teams)
    .innerJoin(
      players,
      and(
        eq(players.id, membership.playerId),
        eq(players.ownerUserId, ownerUserId),
      ),
    )
    .where(
      and(eq(teams.id, membership.teamId), eq(teams.ownerUserId, ownerUserId)),
    );
  return rows.length === 1;
}
export async function insertTeamPlayer(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  membership: TeamPlayer,
): Promise<boolean> {
  return (
    (
      await transaction
        .insert(teamPlayers)
        .values({
          ...membership,
          ownerUserId,
          jerseyNumber: membership.jerseyNumber ?? null,
        })
        .onConflictDoNothing()
        .returning({ id: teamPlayers.id })
    ).length === 1
  );
}
export async function updateTeamPlayer(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  membership: TeamPlayer,
  expectedRevision: number,
): Promise<boolean> {
  return (
    (
      await transaction
        .update(teamPlayers)
        .set({
          jerseyNumber: membership.jerseyNumber ?? null,
          role: membership.role,
          revision: membership.revision,
          updatedAt: membership.updatedAt,
        })
        .where(
          and(
            eq(teamPlayers.id, membership.id),
            eq(teamPlayers.ownerUserId, ownerUserId),
            eq(teamPlayers.teamId, membership.teamId),
            eq(teamPlayers.playerId, membership.playerId),
            eq(teamPlayers.createdAt, membership.createdAt),
            eq(teamPlayers.revision, expectedRevision),
            lte(teamPlayers.updatedAt, membership.updatedAt),
          ),
        )
        .returning({ id: teamPlayers.id })
    ).length === 1
  );
}
