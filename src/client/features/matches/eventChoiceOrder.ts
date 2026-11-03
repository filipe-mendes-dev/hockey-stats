import type {
  LossReason,
  RecoverySubtype,
  ShotOutcome,
} from "../../../domain/matches/matchEvent.schema";

export const recoveryChoiceOrder: readonly RecoverySubtype[] = [
  "loose-ball",
  "interception",
  "duel",
  "intercepted-shot",
  "other",
];

export const lossChoiceOrder: readonly LossReason[] = [
  "intercepted-pass",
  "failed-individual-action",
  "poor-reception",
  "other",
];

export const shotChoiceOrder: readonly ShotOutcome[] = [
  "on-target",
  "goal",
  "off-target",
  "blocked",
];
