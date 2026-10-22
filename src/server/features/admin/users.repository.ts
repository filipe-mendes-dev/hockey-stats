import "server-only";
import { asc, count, eq, ilike, inArray, or } from "drizzle-orm";
import { usersPageSize } from "../../../contracts/admin-users.schema";
import type { UsersDirectoryQuery } from "../../../contracts/admin-users.schema";
import { db } from "../../db/client.ts";
import type { DatabaseTransaction } from "../../db/client.ts";
import {
  auth_user,
  matches,
  matchEvents,
  players,
  teams,
} from "../../db/schema.ts";

const directoryColumns = {
  id: auth_user.id,
  name: auth_user.name,
  username: auth_user.username,
  role: auth_user.role,
  banned: auth_user.banned,
  createdAt: auth_user.createdAt,
};

export async function listUsers(
  transaction: DatabaseTransaction,
  query: UsersDirectoryQuery,
) {
  const pattern = `%${query.search.replace(/[\\%_]/g, "\\$&")}%`;
  const filter = query.search
    ? or(ilike(auth_user.name, pattern), ilike(auth_user.username, pattern))
    : undefined;
  const [result] = await transaction
    .select({ total: count() })
    .from(auth_user)
    .where(filter);
  const total = result?.total ?? 0;
  const page = Math.min(
    query.page,
    Math.max(1, Math.ceil(total / usersPageSize)),
  );
  const users = await transaction
    .select(directoryColumns)
    .from(auth_user)
    .where(filter)
    .orderBy(asc(auth_user.createdAt), asc(auth_user.id))
    .limit(usersPageSize)
    .offset((page - 1) * usersPageSize);
  return { users, total, page };
}

export async function getUserById(userId: string) {
  const [user] = await db
    .select(directoryColumns)
    .from(auth_user)
    .where(eq(auth_user.id, userId));
  return user;
}

export async function getUserForUpdate(
  transaction: DatabaseTransaction,
  userId: string,
) {
  const [user] = await transaction
    .select(directoryColumns)
    .from(auth_user)
    .where(eq(auth_user.id, userId))
    .for("update");
  return user;
}

export async function deleteOwnedMatchEvents(
  transaction: DatabaseTransaction,
  ownerUserId: string,
): Promise<void> {
  await transaction
    .delete(matchEvents)
    .where(
      inArray(
        matchEvents.matchId,
        transaction
          .select({ id: matches.id })
          .from(matches)
          .where(eq(matches.ownerUserId, ownerUserId)),
      ),
    );
}

export async function deleteOwnedMatches(
  transaction: DatabaseTransaction,
  ownerUserId: string,
): Promise<void> {
  await transaction.delete(matches).where(eq(matches.ownerUserId, ownerUserId));
}

export async function deleteOwnedTeams(
  transaction: DatabaseTransaction,
  ownerUserId: string,
): Promise<void> {
  await transaction.delete(teams).where(eq(teams.ownerUserId, ownerUserId));
}

export async function deleteOwnedPlayers(
  transaction: DatabaseTransaction,
  ownerUserId: string,
): Promise<void> {
  await transaction.delete(players).where(eq(players.ownerUserId, ownerUserId));
}

export async function deleteUser(
  transaction: DatabaseTransaction,
  userId: string,
): Promise<void> {
  await transaction.delete(auth_user).where(eq(auth_user.id, userId));
}
