"use client";

import { useQuery } from "@tanstack/react-query";
import { listOutboxOperations } from "../../sync/outbox.repository";
import { listPlayers, getPlayerById } from "../players.repository";

export function playerDetailsKey(id: string | undefined) {
  return ["players", "details", id] as const;
}

export const playersListKey = ["players", "list"] as const;

export function usePlayers() {
  return useQuery({
    queryKey: playersListKey,
    queryFn: listPlayers,
    networkMode: "always",
    retry: false,
  });
}

export function usePlayer(id: string | undefined) {
  return useQuery({
    queryKey: playerDetailsKey(id),
    queryFn: () => (id ? getPlayerById(id) : Promise.resolve(null)),
    networkMode: "always",
    retry: false,
  });
}

export function usePlayerDelivery() {
  return useQuery({
    queryKey: ["players", "outbox"],
    queryFn: listOutboxOperations,
    networkMode: "always",
    retry: false,
  });
}
