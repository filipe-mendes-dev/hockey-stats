"use client";
import { useQuery } from "@tanstack/react-query";
import { listOutboxOperations } from "../outbox.repository";
export function useOutboxOperations() {
  return useQuery({
    queryKey: ["outbox"],
    queryFn: listOutboxOperations,
    networkMode: "always",
    retry: false,
  });
}
