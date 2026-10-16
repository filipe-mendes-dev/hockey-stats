import type { ReactNode } from "react";

export interface PlayerPreview {
  id: string;
  name: string;
}

export interface PlayersPreviewProviderProps {
  children: ReactNode;
}

export interface PlayersPreviewContextValue {
  players: readonly PlayerPreview[];
  search: string;
  added: boolean;
  setSearch(value: string): void;
  addPlayer(name: string): void;
}
