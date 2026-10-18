"use client";
import { useQuery } from "@tanstack/react-query";
import { getMatchSnapshot, listMatchSnapshots } from "../matches.repository";
export const matchesListKey = ["matches", "list"] as const;
export function matchDetailsKey(id: string | undefined) {
  return ["matches", "details", id] as const;
}
export function useMatches() {
  return useQuery({
    queryKey: matchesListKey,
    queryFn: listMatchSnapshots,
    networkMode: "always",
    retry: false,
  });
}
export function useMatch(id: string | undefined) {
  return useQuery({
    queryKey: matchDetailsKey(id),
    queryFn: () => (id ? getMatchSnapshot(id) : Promise.resolve(null)),
    networkMode: "always",
    retry: false,
  });
}
