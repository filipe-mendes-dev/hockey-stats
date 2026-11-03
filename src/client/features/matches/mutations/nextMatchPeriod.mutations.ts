"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startNextMatchPeriod } from "../nextMatchPeriod.service";
import { matchDetailsKey } from "../queries/matches.queries";

export function useStartNextMatchPeriod() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: startNextMatchPeriod,
    networkMode: "always",
    retry: false,
    onSuccess: async (snapshot) => {
      client.setQueryData(matchDetailsKey(snapshot.match.id), snapshot);
      await client.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}
