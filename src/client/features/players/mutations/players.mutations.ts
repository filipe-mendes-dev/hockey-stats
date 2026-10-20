"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPlayer } from "../players.service";
import { playersListKey, playerDetailsKey } from "../queries/players.queries";
import { playerCreated } from "../usePlayersListState";

export function useCreatePlayer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createPlayer,
    networkMode: "always",
    retry: false,
    onSuccess: (player) => {
      playerCreated();
      client.setQueryData(playerDetailsKey(player.id), player);
      void client.invalidateQueries({ queryKey: playersListKey });
    },
  });
}
