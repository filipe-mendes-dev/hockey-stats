import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { DatabaseTransaction } from "../../db/client.ts";
import { matches } from "../../db/matches_schema.ts";
import { matchShares } from "../../db/match_shares_schema.ts";
import { auth_user } from "../../db/auth_schema.ts";
import { teams } from "../../db/teams_schema.ts";
import { shareTokenSchema } from "../../../contracts/match-sharing.schema";

export async function getMatchShare(
  transaction: DatabaseTransaction,
  matchId: string,
): Promise<string | null> {
  const [row] = await transaction
    .select({ token: matchShares.token })
    .from(matchShares)
    .where(eq(matchShares.matchId, matchId));
  return row ? shareTokenSchema.parse(row.token) : null;
}

export async function getSharedMatchReference(
  transaction: DatabaseTransaction,
  token: string,
) {
  const [row] = await transaction
    .select({
      matchId: matches.id,
      ownerUserId: matches.ownerUserId,
      category: teams.category,
    })
    .from(matchShares)
    .innerJoin(matches, eq(matches.id, matchShares.matchId))
    .innerJoin(auth_user, eq(auth_user.id, matches.ownerUserId))
    .innerJoin(teams, eq(teams.id, matches.teamId))
    .where(
      and(
        eq(matchShares.token, token),
        eq(matches.status, "completed"),
        sql`${auth_user.banned} is not true`,
      ),
    );
  return row ?? null;
}

export async function insertMatchShare(
  transaction: DatabaseTransaction,
  matchId: string,
  token: string,
  createdAt: number,
): Promise<void> {
  await transaction.insert(matchShares).values({
    matchId,
    token: shareTokenSchema.parse(token),
    createdAt,
  });
}

export async function deleteMatchShare(
  transaction: DatabaseTransaction,
  matchId: string,
): Promise<void> {
  await transaction.delete(matchShares).where(eq(matchShares.matchId, matchId));
}
