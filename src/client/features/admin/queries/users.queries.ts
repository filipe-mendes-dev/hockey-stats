"use client";

import { useQuery } from "@tanstack/react-query";
import type { UsersDirectoryQuery } from "../../../../contracts/admin-users.schema";
import { fetchUsersDirectory } from "../users.api";

export const usersDirectoryKey = ["admin", "users"] as const;

export function useUsersDirectory(
  userId: string | undefined,
  query: UsersDirectoryQuery,
) {
  return useQuery({
    queryKey: [...usersDirectoryKey, userId, query],
    queryFn: ({ signal }) => {
      if (!userId) throw new Error("An administrator session is required.");
      return fetchUsersDirectory(userId, query, signal);
    },
    enabled: Boolean(userId),
    networkMode: "always",
    retry: false,
    gcTime: 0,
  });
}
