"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPlayer, updatePlayer } from "../players.service";
import { playersListKey, playerDetailsKey } from "../queries/players.queries";
import type { Player } from "../../../../domain/players/player.schema";
import { playerCreated } from "../usePlayersListState";

export function useCreatePlayer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createPlayer,
    networkMode: "always",
    retry: false,
    onSuccess: (player) => {
      playerCreated();
      client.setQueryData<Player[]>(playersListKey, (current) => [
        ...(current ?? []).filter((entry) => entry.id !== player.id),
        player,
      ]);
      client.setQueryData(playerDetailsKey(player.id), player);
      void client.invalidateQueries({ queryKey: playersListKey });
    },
  });
}

export function useUpdatePlayer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updatePlayer,
    networkMode: "always",
    retry: false,
    onSuccess: async (player) => {
      client.setQueryData(playerDetailsKey(player.id), player);
      await client.invalidateQueries({ queryKey: playersListKey });
    },
  });
}
