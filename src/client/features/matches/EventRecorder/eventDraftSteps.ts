import { getEventDraftHalf } from "./eventDraft";
import type { EventDraft } from "./eventDraft";
export type EventDraftStep =
  | "chooseAction"
  | "choosePlayer"
  | "chooseHalf"
  | "chooseSubtype"
  | "chooseReason"
  | "chooseOutcome"
  | "chooseColour"
  | "chooseOutgoing"
  | "chooseIncoming"
  | "eventTimeRequired"
  | "confirmCard"
  | "confirmPowerplayEnd"
  | "saveScore"
  | "chooseGameEvent"
  | "chooseSetPiece"
  | "chooseSave"
  | "chooseTimeoutTeam";
export function getEventDraftSteps(draft: EventDraft): EventDraftStep[] {
  const steps: EventDraftStep[] = [];
  if (!draft.kind)
    return [draft.entry === "game" ? "chooseGameEvent" : "chooseAction"];
  if (draft.selectingSetPiece) return ["chooseSetPiece"];
  if (
    !draft.matchPlayerId &&
    ![
      "opponent-goal",
      "score-adjustment",
      "substitution",
      "powerplay-end",
      "timeout",
    ].includes(draft.kind)
  )
    steps.push("choosePlayer");
  if (
    (draft.kind === "ball-recovery" || draft.kind === "ball-loss") &&
    !getEventDraftHalf(draft)
  )
    steps.push("chooseHalf");
  if (draft.kind === "ball-recovery" && !draft.subtype)
    steps.push("chooseSubtype");
  if (draft.kind === "ball-loss" && !draft.reason) steps.push("chooseReason");
  if (draft.kind === "shot" && !draft.outcome) steps.push("chooseOutcome");
  if (draft.kind === "goalkeeper-save" && !draft.saveConfirmed)
    steps.push("chooseSave");
  if (draft.kind === "timeout" && !draft.team) steps.push("chooseTimeoutTeam");
  if (draft.kind === "card" && !draft.colour) steps.push("chooseColour");
  if (draft.kind === "substitution") {
    if (!draft.outgoingMatchPlayerId) steps.push("chooseOutgoing");
    if (!draft.incomingMatchPlayerId) steps.push("chooseIncoming");
  }
  const needsTime =
    ["substitution", "player-in", "powerplay-end"].includes(draft.kind) ||
    (draft.kind === "card" &&
      draft.colour !== undefined &&
      draft.colour !== "yellow");
  if (needsTime && !draft.gameTime) steps.push("eventTimeRequired");
  if (draft.kind === "card" && draft.lineupEffect === undefined)
    steps.push("confirmCard");
  if (draft.kind === "powerplay-end" && !draft.powerplayConfirmed)
    steps.push("confirmPowerplayEnd");
  if (draft.kind === "score-adjustment") steps.push("saveScore");
  return steps;
}
