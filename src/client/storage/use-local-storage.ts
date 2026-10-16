"use client";

import { useEffect, useState } from "react";
import { createLocalDatabase, initializeLocalWorkspace } from "./database";
import { requestStoragePersistence } from "./persistence";
import type { StoragePersistence } from "./persistence";

type StorageStatus =
  "preparing" | "ready" | "blocked" | "closed" | "unsupported" | "failed";

interface StorageState {
  status: StorageStatus;
  persistence: StoragePersistence | null;
}

interface LocalStorageState extends StorageState {
  retry(): void;
}

export function useLocalStorage(): LocalStorageState {
  const [state, setState] = useState<StorageState>({
    status: "preparing",
    persistence: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let closed = false;
    let opened = false;
    const database = createLocalDatabase();

    database.on("blocked", () => {
      if (!cancelled) setState({ status: "blocked", persistence: null });
    });
    database.on("versionchange", () => database.close());
    database.on("close", () => {
      if (!opened) return;
      closed = true;
      if (!cancelled) setState({ status: "closed", persistence: null });
    });

    async function initialize(): Promise<void> {
      try {
        if (!("indexedDB" in window) || !window.indexedDB) {
          if (!cancelled)
            setState({ status: "unsupported", persistence: null });
          return;
        }

        await database.open();
        opened = true;
        await initializeLocalWorkspace(database);
        const persistence = await requestStoragePersistence();

        if (!cancelled && !closed) setState({ status: "ready", persistence });
      } catch {
        if (!cancelled && !closed) {
          setState({ status: "failed", persistence: null });
        }
      }
    }

    void initialize();
    return () => {
      cancelled = true;
      database.close();
    };
  }, [attempt]);

  function retry(): void {
    setState({ status: "preparing", persistence: null });
    setAttempt((value) => value + 1);
  }

  return { ...state, retry };
}
