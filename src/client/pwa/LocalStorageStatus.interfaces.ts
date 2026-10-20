import type { LocalStorageState } from "../storage/useDatabaseStatus";

export interface LocalStorageStatusProps {
  filesCached: boolean;
  storage: LocalStorageState;
}
