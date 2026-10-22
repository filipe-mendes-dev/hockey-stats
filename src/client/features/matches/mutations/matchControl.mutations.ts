"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { controlMatch } from "../matchControl.service";
import { matchDetailsKey } from "../queries/matches.queries";
export function useControlMatch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: controlMatch,
    networkMode: "always",
    retry: false,
    onSuccess: (snapshot) => {
      client.setQueryData(matchDetailsKey(snapshot.match.id), snapshot);
    },
  });
}
