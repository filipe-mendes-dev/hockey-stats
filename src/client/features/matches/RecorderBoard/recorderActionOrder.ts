import type { PlayerEventKind } from "../../../../domain/matches/matchEvent.schema";

export const recorderPrimaryActions: readonly PlayerEventKind[] = [
  "ball-recovery",
  "shot",
  "ball-loss",
];

export const recorderSecondaryActions: readonly PlayerEventKind[] = [
  "team-foul",
  "card",
  "substitution",
];

export const recorderActionOrder: readonly PlayerEventKind[] = [
  ...recorderPrimaryActions,
  ...recorderSecondaryActions,
  "player-in",
  "goalkeeper-save",
];
