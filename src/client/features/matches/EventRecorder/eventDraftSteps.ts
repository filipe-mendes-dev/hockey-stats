import type { EventDraft } from "./eventDraft";
export type EventDraftStep =
  | "chooseAction"
  | "choosePlayer"
  | "chooseSubtype"
  | "chooseReason"
  | "chooseOutcome"
  | "chooseColour"
  | "chooseOutgoing"
  | "chooseIncoming"
  | "eventTimeRequired"
  | "confirmCard"
  | "confirmPowerplayEnd"
  | "saveScore";
export function getEventDraftSteps(draft: EventDraft): EventDraftStep[] {
  const steps: EventDraftStep[] = [];
  if (!draft.kind) return ["chooseAction"];
  if (
    !draft.matchPlayerId &&
    ![
      "opponent-goal",
      "score-adjustment",
      "substitution",
      "powerplay-end",
    ].includes(draft.kind)
  )
    steps.push("choosePlayer");
  if (draft.kind === "ball-recovery" && !draft.subtype)
    steps.push("chooseSubtype");
  if (draft.kind === "ball-loss" && !draft.reason) steps.push("chooseReason");
  if (draft.kind === "shot" && !draft.outcome) steps.push("chooseOutcome");
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
