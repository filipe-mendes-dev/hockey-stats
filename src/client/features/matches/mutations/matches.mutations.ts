"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMatch, updateMatchSetup, startMatch } from "../matches.service";
import { matchesListKey, matchDetailsKey } from "../queries/matches.queries";
export function useCreateMatch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createMatch,
    networkMode: "always",
    retry: false,
    onSuccess: (snapshot) => {
      client.setQueryData(matchDetailsKey(snapshot.match.id), snapshot);
      void client.invalidateQueries({ queryKey: matchesListKey });
    },
  });
}

export function useUpdateMatchSetup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateMatchSetup,
    networkMode: "always",
    retry: false,
    onSuccess: (snapshot) => {
      client.setQueryData(matchDetailsKey(snapshot.match.id), snapshot);
      void client.invalidateQueries({ queryKey: matchesListKey });
    },
  });
}
export function useStartMatch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: startMatch,
    networkMode: "always",
    retry: false,
    onSuccess: (snapshot) => {
      client.setQueryData(matchDetailsKey(snapshot.match.id), snapshot);
      void client.invalidateQueries({ queryKey: matchesListKey });
    },
  });
}
