"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeLocalDataChanges } from "../../storage/localDataEvents";
import { startSynchronization } from "./syncCoordinator";

export function SyncLifecycle() {
  const client = useQueryClient();
  useEffect(() => {
    const stop = startSynchronization();
    const unsubscribe = subscribeLocalDataChanges(() => {
      void client.invalidateQueries({ queryKey: ["players"] });
    });
    return () => {
      unsubscribe();
      stop();
    };
  }, [client]);

  return null;
}
