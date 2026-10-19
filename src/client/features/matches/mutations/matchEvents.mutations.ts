"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addMatchEvent, undoMatchEvent } from "../matchEvents.service";
export function useAddMatchEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: addMatchEvent,
    networkMode: "always",
    retry: false,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}
export function useUndoMatchEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: undoMatchEvent,
    networkMode: "always",
    retry: false,
    onSettled: () => {
      void client.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}
