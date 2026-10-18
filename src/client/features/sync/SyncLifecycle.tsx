"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeLocalDataChanges } from "../../storage/localDataEvents";
import { startSynchronization } from "./syncCoordinator";

export function SyncLifecycle() {
  const client = useQueryClient();
  useEffect(() => {
    const stop = startSynchronization();
    const unsubscribe = subscribeLocalDataChanges((change) => {
      const features =
        change.feature === "all" ? ["players", "teams"] : [change.feature];
      for (const feature of features)
        void client.invalidateQueries({ queryKey: [feature] });
      void client.invalidateQueries({ queryKey: ["outbox"] });
    });
    return () => {
      unsubscribe();
      stop();
    };
  }, [client]);

  return null;
}
