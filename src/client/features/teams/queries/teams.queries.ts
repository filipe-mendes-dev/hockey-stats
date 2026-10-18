"use client";
import { useQuery } from "@tanstack/react-query";
import { listTeams, getTeamById } from "../teams.repository";
export const teamsListKey = ["teams", "list"] as const;
export function teamDetailsKey(id: string | undefined) {
  return ["teams", "details", id] as const;
}
export function useTeams() {
  return useQuery({
    queryKey: teamsListKey,
    queryFn: listTeams,
    networkMode: "always",
    retry: false,
  });
}
export function useTeam(id: string | undefined) {
  return useQuery({
    queryKey: teamDetailsKey(id),
    queryFn: () => (id ? getTeamById(id) : Promise.resolve(null)),
    networkMode: "always",
    retry: false,
  });
}
