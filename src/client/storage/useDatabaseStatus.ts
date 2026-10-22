"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { DatabaseStatus } from "./database";
import {
  getDatabase,
  getDatabaseStatus,
  getServerDatabaseStatus,
  subscribeDatabaseStatus,
} from "./database";

export interface LocalStorageState extends DatabaseStatus {
  retry(): void;
}

export function useDatabaseStatus(): LocalStorageState {
  const state = useSyncExternalStore(
    subscribeDatabaseStatus,
    getDatabaseStatus,
    getServerDatabaseStatus,
  );

  useEffect(() => {
    void getDatabase().catch(() => undefined);
  }, []);

  function retry(): void {
    void getDatabase().catch(() => undefined);
  }

  return { ...state, retry };
}
