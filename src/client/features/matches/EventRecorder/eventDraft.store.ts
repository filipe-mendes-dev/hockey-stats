import { createStore } from "zustand/vanilla";
import { transitionEventDraft } from "./eventDraft";
import type { EventDraftState, EventDraftAction } from "./eventDraft";
export interface EventDraftStore {
  state: EventDraftState;
  dispatch(action: EventDraftAction): void;
}
export function createEventDraftStore() {
  return createStore<EventDraftStore>()((set) => ({
    state: { phase: "idle" },
    dispatch: (action) =>
      set((store) => ({ state: transitionEventDraft(store.state, action) })),
  }));
}
