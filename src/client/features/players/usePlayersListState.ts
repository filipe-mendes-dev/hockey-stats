"use client";

import { useSyncExternalStore } from "react";

interface PlayersListState {
  search: string;
  added: boolean;
}

const emptyState: PlayersListState = { search: "", added: false };
let currentState = emptyState;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getServerSnapshot(): PlayersListState {
  return emptyState;
}

function update(state: PlayersListState): void {
  currentState = state;
  listeners.forEach((listener) => listener());
}

export function playerCreated(): void {
  update({ search: "", added: true });
}

export function usePlayersListState() {
  const state = useSyncExternalStore(
    subscribe,
    () => currentState,
    getServerSnapshot,
  );

  function setSearch(search: string): void {
    update({ ...state, search });
  }

  return { ...state, setSearch };
}
