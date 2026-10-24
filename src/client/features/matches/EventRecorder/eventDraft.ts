import type { Match } from "../../../../domain/matches/match.schema";
import { getPowerplayDuration } from "../../../../domain/matches/powerplay";
import { getClockElapsed } from "../../../../domain/matches/matchControl";
import type {
  AddMatchEventInput,
  CardLineupEffect,
  MatchTime,
  RecoverySubtype,
  LossReason,
  ShotOutcome,
  CardColour,
  RinkPosition,
  RinkHalf,
  AttemptType,
  SaveDifficulty,
  TimeoutTeam,
} from "../../../../domain/matches/matchEvent.schema";
import { addMatchEventInputSchema } from "../../../../domain/matches/matchEvent.schema";
import {
  getPositionHalf,
  getRestartSpot,
  supportsRinkPosition,
} from "../../../../domain/matches/rinkPosition";

export interface EventDraft {
  id: string;
  operationId: string;
  matchId: string;
  period: number;
  capturedAt: number;
  entry?: "game" | "rink";
  capturedGoalkeeperId?: string;
  selectingSetPiece?: boolean;
  saveConfirmed?: boolean;
  attemptType?: AttemptType;
  difficulty?: SaveDifficulty;
  team?: TimeoutTeam;
  gameTime?: MatchTime;
  position?: RinkPosition;
  rinkHalf?: RinkHalf;
  matchPlayerId?: string;
  kind?: AddMatchEventInput["kind"];
  outgoingMatchPlayerId?: string;
  incomingMatchPlayerId?: string;
  replacementMatchPlayerId?: string;
  removedMatchPlayerId?: string;
  powerplayCardEventId?: string;
  powerplayConfirmed?: true;
  lineupEffect?: CardLineupEffect;
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
  | { type: "restoreChoices"; draft: EventDraft }
  | { type: "selectPlayer"; id: string }
  | { type: "setPosition"; position: RinkPosition }
  | { type: "clearPosition" }
  | {
      type: "selectGameEvent";
      event: "opponent-goal" | "timeout" | "set-piece";
    }
  | { type: "openSetPiece" }
  | { type: "selectAttemptType"; attemptType: "penalty" | "direct-free-hit" }
  | { type: "confirmSave"; difficulty: SaveDifficulty }
  | { type: "selectTimeoutTeam"; team: TimeoutTeam }
  | {
      type: "selectKind";
      kind: AddMatchEventInput["kind"];
      selectedPlayerIsActive?: boolean;
    }
  | { type: "selectSubstitute"; side: "outgoing" | "incoming"; id: string }
  | {
      type: "confirmCard";
      effect: CardLineupEffect;
      replacementId?: string;
      removedId?: string;
    }
  | { type: "confirmPowerplayEnd"; cardEventId: string }
  | { type: "selectHalf"; rinkHalf: RinkHalf }
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
    case "selectGameEvent":
      if (state.draft.entry !== "game" || state.draft.kind) return state;
      return {
        ...state,
        draft: {
          ...state.draft,
          kind: action.event === "set-piece" ? "shot" : action.event,
          ...(action.event === "set-piece" ? { selectingSetPiece: true } : {}),
          ...(action.event === "opponent-goal" &&
          state.draft.capturedGoalkeeperId
            ? { matchPlayerId: state.draft.capturedGoalkeeperId }
            : {}),
        },
      };
    case "openSetPiece":
      return state.draft.kind === "shot" && state.draft.entry !== "rink"
        ? { ...state, draft: { ...state.draft, selectingSetPiece: true } }
        : state;
    case "selectAttemptType":
      return state.draft.kind === "shot" &&
        state.draft.selectingSetPiece &&
        state.draft.entry !== "rink"
        ? {
            ...state,
            draft: {
              ...state.draft,
              selectingSetPiece: false,
              attemptType: action.attemptType,
              position: getRestartSpot(action.attemptType),
            },
          }
        : state;
    case "confirmSave":
      return state.draft.kind === "goalkeeper-save"
        ? {
            ...state,
            draft: {
              ...state.draft,
              saveConfirmed: true,
              difficulty: action.difficulty,
            },
          }
        : state;
    case "selectTimeoutTeam":
      return state.draft.kind === "timeout"
        ? { ...state, draft: { ...state.draft, team: action.team } }
        : state;
    case "restoreChoices":
      return {
        phase: "collecting",
        draft: {
          ...action.draft,
          ...(state.draft.position ? { position: state.draft.position } : {}),
          ...((action.draft.kind === "ball-recovery" ||
            action.draft.kind === "ball-loss") &&
          state.draft.position
            ? {
                rinkHalf:
                  getPositionHalf(state.draft.position) ??
                  action.draft.rinkHalf,
              }
            : {}),
          id: state.draft.id,
          operationId: state.draft.operationId,
          matchId: state.draft.matchId,
          period: state.draft.period,
          capturedAt: state.draft.capturedAt,
          ...(state.draft.gameTime ? { gameTime: state.draft.gameTime } : {}),
        },
      };

    case "selectPlayer":
      return { ...state, draft: { ...state.draft, matchPlayerId: action.id } };
    case "clearPosition": {
      const draft = { ...state.draft };
      delete draft.position;
      if (draft.kind === "ball-recovery" || draft.kind === "ball-loss")
        delete draft.rinkHalf;
      return { ...state, draft };
    }
    case "setPosition": {
      const draft = { ...state.draft, position: action.position };
      if (draft.kind === "ball-recovery" || draft.kind === "ball-loss") {
        const half = getPositionHalf(action.position);
        if (half) draft.rinkHalf = half;
        else delete draft.rinkHalf;
      }
      return { ...state, draft };
    }
    case "selectKind": {
      const draft = { ...state.draft, kind: action.kind };
      if (state.draft.kind !== action.kind) {
        delete draft.rinkHalf;
        delete draft.subtype;
        delete draft.reason;
        delete draft.outcome;
        delete draft.colour;
        delete draft.ownDelta;
        delete draft.opponentDelta;
        delete draft.lineupEffect;
        delete draft.replacementMatchPlayerId;
        delete draft.removedMatchPlayerId;
        delete draft.powerplayCardEventId;
        delete draft.powerplayConfirmed;
        delete draft.outgoingMatchPlayerId;
        delete draft.incomingMatchPlayerId;
        delete draft.attemptType;
        delete draft.selectingSetPiece;
        delete draft.saveConfirmed;
        delete draft.difficulty;
        delete draft.team;
      }
      if (action.kind === "substitution") {
        if (draft.matchPlayerId) {
          if (action.selectedPlayerIsActive)
            draft.outgoingMatchPlayerId = draft.matchPlayerId;
          else draft.incomingMatchPlayerId = draft.matchPlayerId;
        }
        delete draft.matchPlayerId;
      }
      if (!supportsRinkPosition(action.kind)) delete draft.position;
      if (action.kind === "shot") draft.attemptType = "open-play";
      if (
        (action.kind === "ball-recovery" || action.kind === "ball-loss") &&
        draft.position
      ) {
        const half = getPositionHalf(draft.position);
        if (half) draft.rinkHalf = half;
      }
      if (
        action.kind === "opponent-goal" ||
        action.kind === "score-adjustment" ||
        action.kind === "powerplay-end"
      ) {
        delete draft.matchPlayerId;
        delete draft.position;
      }
      return { ...state, draft };
    }
    case "selectSubstitute":
      return state.draft.kind === "substitution"
        ? {
            ...state,
            draft: {
              ...state.draft,
              [action.side === "outgoing"
                ? "outgoingMatchPlayerId"
                : "incomingMatchPlayerId"]: action.id,
            },
          }
        : state;
    case "confirmPowerplayEnd":
      return state.draft.kind === "powerplay-end"
        ? {
            ...state,
            draft: {
              ...state.draft,
              powerplayCardEventId:
                state.draft.powerplayCardEventId ?? action.cardEventId,
              powerplayConfirmed: true,
            },
          }
        : state;
    case "confirmCard":
      return state.draft.kind === "card"
        ? {
            ...state,
            draft: {
              ...state.draft,
              lineupEffect: action.effect,
              ...(action.removedId
                ? { removedMatchPlayerId: action.removedId }
                : {}),
              ...(action.replacementId
                ? { replacementMatchPlayerId: action.replacementId }
                : {}),
            },
          }
        : state;
    case "selectHalf":
      return state.draft.kind === "ball-recovery" ||
        state.draft.kind === "ball-loss"
        ? { ...state, draft: { ...state.draft, rinkHalf: action.rinkHalf } }
        : state;
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
  if (draft.kind === "powerplay-end" && !draft.powerplayConfirmed) return null;
  if (
    draft.selectingSetPiece ||
    (draft.kind === "goalkeeper-save" && !draft.saveConfirmed)
  )
    return null;
  const {
    powerplayConfirmed,
    entry,
    capturedGoalkeeperId,
    selectingSetPiece,
    saveConfirmed,
    ...fields
  } = draft;
  void powerplayConfirmed;
  void entry;
  void capturedGoalkeeperId;
  void selectingSetPiece;
  void saveConfirmed;
  const result = addMatchEventInputSchema.safeParse({
    ...fields,
    ...(draft.kind === "shot"
      ? { attemptType: draft.attemptType ?? "open-play" }
      : {}),
    ...(draft.kind === "card"
      ? {
          startsPowerplay: draft.colour !== "yellow",
          ...(draft.colour === "blue" || draft.colour === "red"
            ? { powerplayDurationMs: getPowerplayDuration(draft.colour) }
            : {}),
        }
      : {}),
    ...(draft.kind === "player-in" ? { entryReason: "powerplay-ended" } : {}),
  });
  return result.success ? result.data : null;
}

export function captureEventDraft(
  match: Match,
  initial: Pick<EventDraft, "matchPlayerId" | "kind" | "entry">,
  powerplayCardEventId?: string,
): EventDraft {
  const capturedAt = Date.now();
  const elapsedMs = getClockElapsed(match, capturedAt);
  return {
    id: crypto.randomUUID(),
    operationId: crypto.randomUUID(),
    matchId: match.id,
    period: match.currentPeriod,
    capturedAt,
    ...(elapsedMs === undefined ? {} : { gameTime: { elapsedMs } }),
    ...initial,
    ...(initial.kind === "powerplay-end" && powerplayCardEventId !== undefined
      ? { powerplayCardEventId }
      : {}),
  };
}
