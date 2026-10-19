import type {
  AddMatchEventInput,
  MatchEvent,
  MatchTime,
  RecoverySubtype,
  LossReason,
  ShotOutcome,
  CardColour,
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
  reason?: LossReason;
  outcome?: ShotOutcome;
  colour?: CardColour;
  ownDelta?: number;
  opponentDelta?: number;
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
  | { type: "selectReason"; reason: LossReason }
  | { type: "selectOutcome"; outcome: ShotOutcome }
  | { type: "selectColour"; colour: CardColour }
  | { type: "setTime"; elapsedMs: number }
  | { type: "setScoreAdjustment"; ownDelta: number; opponentDelta: number }
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
      if (state.draft.kind !== action.kind) {
        delete draft.subtype;
        delete draft.reason;
        delete draft.outcome;
        delete draft.colour;
        delete draft.ownDelta;
        delete draft.opponentDelta;
      }
      if (action.kind === "player-in" || action.kind === "player-out")
        delete draft.position;
      if (
        action.kind === "opponent-goal" ||
        action.kind === "score-adjustment"
      ) {
        delete draft.matchPlayerId;
        delete draft.position;
      }
      return { ...state, draft };
    }
    case "selectSubtype":
      return state.draft.kind === "ball-recovery"
        ? { ...state, draft: { ...state.draft, subtype: action.subtype } }
        : state;
    case "selectReason":
      return state.draft.kind === "ball-loss"
        ? { ...state, draft: { ...state.draft, reason: action.reason } }
        : state;
    case "selectOutcome":
      return state.draft.kind === "shot"
        ? { ...state, draft: { ...state.draft, outcome: action.outcome } }
        : state;
    case "selectColour":
      return state.draft.kind === "card"
        ? { ...state, draft: { ...state.draft, colour: action.colour } }
        : state;
    case "setTime":
      return {
        ...state,
        draft: { ...state.draft, gameTime: { elapsedMs: action.elapsedMs } },
      };
    case "setScoreAdjustment":
      return state.draft.kind === "score-adjustment"
        ? {
            ...state,
            draft: {
              ...state.draft,
              ownDelta: action.ownDelta,
              opponentDelta: action.opponentDelta,
            },
          }
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
