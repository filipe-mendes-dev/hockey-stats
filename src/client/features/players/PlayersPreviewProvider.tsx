"use client";

import { createContext, useContext, useState } from "react";
import type {
  PlayerPreview,
  PlayersPreviewContextValue,
  PlayersPreviewProviderProps,
} from "./PlayersPreview.interfaces";

const PlayersPreviewContext = createContext<PlayersPreviewContextValue | null>(
  null,
);

export function PlayersPreviewProvider({
  children,
}: PlayersPreviewProviderProps) {
  const [players, setPlayers] = useState<PlayerPreview[]>([]);
  const [search, setSearch] = useState("");
  const [added, setAdded] = useState(false);

  function addPlayer(name: string): void {
    setPlayers((current) => [...current, { id: crypto.randomUUID(), name }]);
    setSearch("");
    setAdded(true);
  }

  return (
    <PlayersPreviewContext.Provider
      value={{ players, search, added, setSearch, addPlayer }}
    >
      {children}
    </PlayersPreviewContext.Provider>
  );
}

export function usePlayersPreview(): PlayersPreviewContextValue {
  const context = useContext(PlayersPreviewContext);
  if (!context) throw new Error("PlayersPreviewProvider is required");
  return context;
}
