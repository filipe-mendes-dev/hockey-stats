"use client";
import { useQuery } from "@tanstack/react-query";
import { listMatchEvents, getLatestUndoEvent } from "../matchEvents.repository";
export function useMatchEvents(matchId: string) {
  return useQuery({
    queryKey: ["matches", "events", matchId],
    queryFn: () => listMatchEvents(matchId),
    networkMode: "always",
    retry: false,
  });
}
export function useLatestUndoEvent(matchId: string) {
  return useQuery({
    queryKey: ["matches", "undo", matchId],
    queryFn: () => getLatestUndoEvent(matchId),
    networkMode: "always",
    retry: false,
  });
}
