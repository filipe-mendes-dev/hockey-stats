import type {
  AddMatchEventInput,
  MatchEvent,
  MatchTime,
  RecoverySubtype,
  RinkPosition,
} from "../../../../domain/matches/matchEvent.schema";
import { addMatchEventInputSchema } from "../../../../domain/matches/matchEvent.schema";

export interface EventDraft {
  id: string;
  operationId: string;
  matchId: string;
  period: number;
  capturedAt: number;
  gameTime?: MatchTime;
  position?: RinkPosition;
  matchPlayerId?: string;
  kind?: MatchEvent["kind"];
  subtype?: RecoverySubtype;
}
export type EventDraftState =
  | { phase: "idle" }
  | { phase: "collecting"; draft: EventDraft }
  | {
      phase: "saving" | "failed";
      draft: EventDraft;
      input: AddMatchEventInput;
    };
export type EventDraftAction =
  | { type: "open"; draft: EventDraft }
  | { type: "selectPlayer"; id: string }
  | { type: "selectKind"; kind: MatchEvent["kind"] }
  | { type: "selectSubtype"; subtype: RecoverySubtype }
  | { type: "saving"; input: AddMatchEventInput }
  | { type: "failed" }
  | { type: "retry" }
  | { type: "saved" }
  | { type: "cancel" };
export function transitionEventDraft(
  state: EventDraftState,
  action: EventDraftAction,
): EventDraftState {
  if (action.type === "saved")
    return state.phase === "saving" ? { phase: "idle" } : state;
  if (action.type === "failed")
    return state.phase === "saving" ? { ...state, phase: "failed" } : state;
  if (action.type === "retry")
    return state.phase === "failed" ? { ...state, phase: "saving" } : state;
  if (state.phase === "saving") return state;
  if (action.type === "cancel") return { phase: "idle" };
  if (action.type === "open")
    return state.phase === "idle"
      ? { phase: "collecting", draft: action.draft }
      : state;
  if (state.phase !== "collecting") return state;
  switch (action.type) {
    case "selectPlayer":
      return { ...state, draft: { ...state.draft, matchPlayerId: action.id } };
    case "selectKind": {
      const draft = { ...state.draft, kind: action.kind };
      if (state.draft.kind !== action.kind) delete draft.subtype;
      return { ...state, draft };
    }
    case "selectSubtype":
      return state.draft.kind === "ball-recovery"
        ? { ...state, draft: { ...state.draft, subtype: action.subtype } }
        : state;
    case "saving":
      return { phase: "saving", draft: state.draft, input: action.input };
    default:
      return state;
  }
}
export function completeEventDraft(
  draft: EventDraft,
): AddMatchEventInput | null {
  const result = addMatchEventInputSchema.safeParse(draft);
  return result.success ? result.data : null;
}
