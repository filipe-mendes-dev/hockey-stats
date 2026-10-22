import "server-only";
import { randomUUID } from "node:crypto";
import type {
  AdminUserAction,
  UsersDirectoryQuery,
} from "../../../contracts/admin-users.schema";
import { usersDirectorySchema } from "../../../contracts/admin-users.schema";
import { auth } from "../../auth/auth.ts";
import { db } from "../../db/client.ts";
import { AdminUsersError } from "./users.errors";
import {
  deleteOwnedMatchEvents,
  deleteOwnedMatches,
  deleteOwnedPlayers,
  deleteOwnedTeams,
  deleteUser,
  getUserById,
  getUserForUpdate,
  listUsers,
} from "./users.repository";

async function requireAdministrator(headers: Headers): Promise<void> {
  const session = await auth.api.getSession({
    headers,
    query: { disableCookieCache: true },
  });
  if (!session || session.user.banned)
    throw new AdminUsersError("authentication_required", 401);
  if (session.user.role !== "admin")
    throw new AdminUsersError("forbidden", 403);
  if (headers.get("X-Expected-User-Id") !== session.user.id)
    throw new AdminUsersError("account_mismatch", 403);
}

function requireNormalUser(user: Awaited<ReturnType<typeof getUserById>>) {
  if (!user) throw new AdminUsersError("user_not_found", 404);
  if (user.role !== "user") throw new AdminUsersError("protected_account", 403);
  return user;
}

export async function getUsersDirectory(
  headers: Headers,
  query: UsersDirectoryQuery,
) {
  await requireAdministrator(headers);
  return db.transaction(
    async (transaction) => {
      const result = await listUsers(transaction, query);
      return usersDirectorySchema.parse({
        ...result,
        users: result.users.map((user) => ({
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          disabled: user.banned === true,
          createdAt: user.createdAt.toISOString(),
        })),
      });
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}

export async function manageUser(
  headers: Headers,
  action: AdminUserAction,
): Promise<void> {
  await requireAdministrator(headers);
  if (action.action === "create") {
    await auth.api.createUser({
      headers,
      body: {
        email: `${randomUUID()}@users.benchline.invalid`,
        name: action.name,
        password: action.password,
        data: { username: action.username },
      },
    });
    return;
  }

  if (action.action === "delete") {
    await db.transaction(async (transaction) => {
      const user = requireNormalUser(
        await getUserForUpdate(transaction, action.userId),
      );
      if (!user.banned) throw new AdminUsersError("disable_before_delete", 409);
      if (!user.username || action.confirmation !== user.username)
        throw new AdminUsersError("confirmation_mismatch", 400);
      await deleteOwnedMatchEvents(transaction, user.id);
      await deleteOwnedMatches(transaction, user.id);
      await deleteOwnedTeams(transaction, user.id);
      await deleteOwnedPlayers(transaction, user.id);
      await deleteUser(transaction, user.id);
    });
    return;
  }

  const user = requireNormalUser(await getUserById(action.userId));
  switch (action.action) {
    case "edit":
      await auth.api.adminUpdateUser({
        headers,
        body: { userId: user.id, data: { name: action.name } },
      });
      break;
    case "password":
      await auth.api.setUserPassword({
        headers,
        body: { userId: user.id, newPassword: action.password },
      });
      try {
        await auth.api.revokeUserSessions({
          headers,
          body: { userId: user.id },
        });
      } catch {
        throw new AdminUsersError("session_revocation_failed", 503);
      }
      break;
    case "disable":
      await auth.api.banUser({ headers, body: { userId: user.id } });
      break;
    case "enable":
      await auth.api.unbanUser({ headers, body: { userId: user.id } });
      break;
  }
}
