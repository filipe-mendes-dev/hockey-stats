"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getDatabase,
  getDatabaseStatus,
  getServerDatabaseStatus,
  subscribeDatabaseStatus,
} from "./database";

export function useDatabaseStatus() {
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
