"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addPlayersToTeam, updateTeamPlayer } from "../teamRoster.service";
import { createTeam, updateTeam } from "../teams.service";
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

export function useUpdateTeam() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateTeam,
    networkMode: "always",
    retry: false,
    onSuccess: (team) => {
      client.setQueryData(teamDetailsKey(team.id), team);
      void client.invalidateQueries({ queryKey: teamsListKey });
    },
  });
}
export function useAddTeamPlayers() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: addPlayersToTeam,
    networkMode: "always",
    retry: false,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["teamPlayers"] });
    },
  });
}
export function useUpdateTeamPlayer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateTeamPlayer,
    networkMode: "always",
    retry: false,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["teamPlayers"] });
    },
  });
}
