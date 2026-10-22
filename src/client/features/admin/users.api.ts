import { z } from "zod";
import {
  adminUsersErrorCodeSchema,
  usersDirectorySchema,
} from "../../../contracts/admin-users.schema";
import type {
  AdminUserAction,
  AdminUsersErrorCode,
  UsersDirectory,
  UsersDirectoryQuery,
} from "../../../contracts/admin-users.schema";

export class AdminUsersRequestError extends Error {
  constructor(public readonly code: AdminUsersErrorCode) {
    super(code);
    this.name = "AdminUsersRequestError";
  }
}

async function readResponse(response: Response): Promise<unknown> {
  const value: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const result = z
      .object({ code: adminUsersErrorCodeSchema })
      .safeParse(value);
    throw new AdminUsersRequestError(
      result.success ? result.data.code : "unavailable",
    );
  }
  return value;
}

export async function fetchUsersDirectory(
  userId: string,
  query: UsersDirectoryQuery,
  signal: AbortSignal,
): Promise<UsersDirectory> {
  const parameters = new URLSearchParams({
    search: query.search,
    page: String(query.page),
  });
  const response = await fetch(`/api/admin/users?${parameters}`, {
    cache: "no-store",
    headers: { "X-Expected-User-Id": userId },
    signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
  });
  return usersDirectorySchema.parse(await readResponse(response));
}

export async function submitUserAction(
  userId: string,
  action: AdminUserAction,
): Promise<void> {
  const response = await fetch("/api/admin/users", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Expected-User-Id": userId,
    },
    body: JSON.stringify(action),
    signal: AbortSignal.timeout(15_000),
  });
  z.object({ success: z.literal(true) }).parse(await readResponse(response));
}
