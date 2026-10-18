"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTeam } from "../teams.service";
import { teamsListKey, teamDetailsKey } from "../queries/teams.queries";
export function useCreateTeam() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createTeam,
    networkMode: "always",
    retry: false,
    onSuccess: (team) => {
      client.setQueryData(teamDetailsKey(team.id), team);
      void client.invalidateQueries({ queryKey: teamsListKey });
    },
  });
}
