"use client";

import { useSyncExternalStore } from "react";
import {
  getServerSyncStatus,
  getSyncStatus,
  subscribeSyncStatus,
} from "./syncCoordinator";

export function useSyncStatus() {
  return useSyncExternalStore(
    subscribeSyncStatus,
    getSyncStatus,
    getServerSyncStatus,
  );
}
