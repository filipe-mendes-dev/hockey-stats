"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { controlMatch } from "../matchControl.service";
export function useControlMatch() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: controlMatch,
    networkMode: "always",
    retry: false,
    onSettled: () => {
      void client.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}
