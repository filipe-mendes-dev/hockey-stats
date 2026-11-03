import { z } from "zod";
import { restartSpots } from "./rinkPosition";
export const rinkPositionSchema = z.strictObject({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});
export const matchTimeSchema = z.strictObject({
  elapsedMs: z.int().nonnegative(),
});
export const playerEventKindSchema = z.enum([
  "ball-recovery",
  "ball-loss",
  "shot",
  "team-foul",
  "card",
  "substitution",
  "player-in",
  "goalkeeper-save",
]);
export const matchEventKindSchema = z.enum([
  ...playerEventKindSchema.options,
  "suspension-end",
  "powerplay-end",
  "powerplay-adjust",
  "player-out",
  "opponent-goal",
  "score-adjustment",
  "timeout",
]);
export const recoverySubtypeSchema = z.enum([
  "interception",
  "duel",
  "loose-ball",
  "other",
  "intercepted-shot",
]);
export const attemptTypeSchema = z.enum([
  "open-play",
  "penalty",
  "direct-free-hit",
]);
export const saveDifficultySchema = z.enum(["simple", "difficult"]);
export const timeoutTeamSchema = z.enum(["own", "opponent"]);
export const lossReasonSchema = z.enum([
  "intercepted-pass",
  "failed-individual-action",
  "poor-reception",
  "other",
]);
export const shotOutcomeSchema = z.enum([
  "goal",
  "on-target",
  "off-target",
  "blocked",
]);
export const cardColourSchema = z.enum(["yellow", "blue", "red"]);
const base = {
  matchId: z.uuidv4(),
  period: z.int().positive(),
  capturedAt: z.int().positive(),
  gameTime: matchTimeSchema.optional(),
};
const player = { ...base, matchPlayerId: z.uuidv4() };
export const rinkHalfSchema = z.enum(["defensive", "attacking"]);
const spatial = { ...player, position: rinkPositionSchema.optional() };
export const recoveryFieldsSchema = z.strictObject({
  ...spatial,
  kind: playerEventKindSchema.extract(["ball-recovery"]),
  subtype: recoverySubtypeSchema,
  rinkHalf: rinkHalfSchema.optional(),
});
const loss = z.strictObject({
  ...spatial,
  kind: playerEventKindSchema.extract(["ball-loss"]),
  reason: lossReasonSchema,
  rinkHalf: rinkHalfSchema.optional(),
});
const legacyLoss = loss.extend({
  reason: lossReasonSchema.exclude(["poor-reception"]),
});
const shot = z.strictObject({
  ...spatial,
  kind: playerEventKindSchema.extract(["shot"]),
  outcome: shotOutcomeSchema,
  attemptType: attemptTypeSchema.optional(),
});
const goalkeeperSave = z.strictObject({
  ...player,
  kind: z.literal("goalkeeper-save"),
  difficulty: saveDifficultySchema.optional(),
});
const timeout = z.strictObject({
  ...base,
  kind: z.literal("timeout"),
  team: timeoutTeamSchema,
});
const foul = z.strictObject({
  ...spatial,
  kind: playerEventKindSchema.extract(["team-foul"]),
});
export const cardLineupEffectSchema = z.enum(["none", "remove", "replace"]);
const card = z
  .strictObject({
    ...spatial,
    kind: playerEventKindSchema.extract(["card"]),
    colour: cardColourSchema,
    lineupEffect: cardLineupEffectSchema.optional(),
    startsPowerplay: z.boolean().optional(),
    powerplayDurationMs: z.int().positive().max(3_600_000).optional(),
    removedMatchPlayerId: z.uuidv4().optional(),
    replacementMatchPlayerId: z.uuidv4().optional(),
  })
  .refine((event) => {
    if (event.powerplayDurationMs !== undefined && !event.startsPowerplay)
      return false;
    if (event.startsPowerplay !== undefined) {
      if (event.startsPowerplay !== (event.colour !== "yellow")) return false;
      if (event.startsPowerplay && !event.gameTime) return false;
      if (
        event.lineupEffect === "remove"
          ? !event.removedMatchPlayerId
          : event.removedMatchPlayerId !== undefined
      )
        return false;
    } else if (event.removedMatchPlayerId !== undefined) return false;
    if (event.lineupEffect === undefined)
      return event.replacementMatchPlayerId === undefined;
    if (event.colour === "yellow" && event.lineupEffect !== "none")
      return false;
    if (event.lineupEffect !== "none" && event.gameTime === undefined)
      return false;
    return event.lineupEffect === "replace"
      ? event.replacementMatchPlayerId !== undefined &&
          event.replacementMatchPlayerId !== event.matchPlayerId
      : event.replacementMatchPlayerId === undefined;
  });
const currentCard = card.safeExtend({
  lineupEffect: cardLineupEffectSchema,
  startsPowerplay: z.boolean(),
});
const playerIn = z.strictObject({
  ...player,
  kind: z.literal("player-in"),
  gameTime: matchTimeSchema,
  entryReason: z.literal("powerplay-ended").optional(),
});
const playerOut = z.strictObject({
  ...player,
  kind: z.literal("player-out"),
  gameTime: matchTimeSchema,
});
const substitution = z
  .strictObject({
    ...base,
    kind: playerEventKindSchema.extract(["substitution"]),
    outgoingMatchPlayerId: z.uuidv4(),
    incomingMatchPlayerId: z.uuidv4(),
    gameTime: matchTimeSchema,
  })
  .refine(
    (event) => event.outgoingMatchPlayerId !== event.incomingMatchPlayerId,
  );
const suspensionEnd = z.strictObject({
  ...player,
  kind: z.literal("suspension-end"),
});
const powerplayEnd = z.strictObject({
  ...base,
  kind: z.literal("powerplay-end"),
  gameTime: matchTimeSchema,
  powerplayCardEventId: z.uuidv4(),
});
const powerplayAdjust = z.strictObject({
  ...base,
  kind: z.literal("powerplay-adjust"),
  gameTime: matchTimeSchema,
  powerplayCardEventId: z.uuidv4(),
  powerplayDurationMs: z.int().positive().max(3_600_000),
});
const opponentGoal = z.strictObject({
  ...base,
  kind: matchEventKindSchema.extract(["opponent-goal"]),
  matchPlayerId: z.uuidv4().optional(),
});
const scoreAdjustment = z
  .strictObject({
    ...base,
    kind: matchEventKindSchema.extract(["score-adjustment"]),
    ownDelta: z.int().min(-2147483648).max(2147483647),
    opponentDelta: z.int().min(-2147483648).max(2147483647),
  })
  .refine((event) => event.ownDelta !== 0 || event.opponentDelta !== 0);
const identity = { id: z.uuidv4(), operationId: z.uuidv4() };
const commonEventInputs = [
  shot.omit({ attemptType: true }).extend(identity),
  foul.extend(identity),
  currentCard.safeExtend(identity),
  substitution.safeExtend(identity),
  playerIn.safeExtend({
    ...identity,
    entryReason: z.literal("powerplay-ended"),
  }),
  powerplayEnd.extend(identity),
  opponentGoal.omit({ matchPlayerId: true }).extend(identity),
] as const;
export const versionThreeMatchEventInputSchema = z.discriminatedUnion("kind", [
  recoveryFieldsSchema.extend({
    ...identity,
    subtype: recoverySubtypeSchema.exclude(["intercepted-shot"]),
  }),
  legacyLoss.extend(identity),
  ...commonEventInputs,
  scoreAdjustment.safeExtend(identity),
]);
export const versionFourMatchEventInputSchema = z.discriminatedUnion("kind", [
  recoveryFieldsSchema.extend({
    ...identity,
    rinkHalf: rinkHalfSchema,
    subtype: recoverySubtypeSchema.exclude(["intercepted-shot"]),
  }),
  legacyLoss.extend({ ...identity, rinkHalf: rinkHalfSchema }),
  ...commonEventInputs,
  scoreAdjustment.safeExtend({ ...identity, ownDelta: z.literal(0) }),
]);

export const versionFiveMatchEventInputSchema = z
  .discriminatedUnion("kind", [
    ...versionFourMatchEventInputSchema.options,
    powerplayAdjust.extend(identity),
  ])
  .refine(
    (event) =>
      event.kind !== "card" ||
      !event.startsPowerplay ||
      event.powerplayDurationMs !== undefined,
  );

const expandedEventInputs = [
  loss.extend({ ...identity, rinkHalf: rinkHalfSchema }),
  foul.extend(identity),
  currentCard.safeExtend(identity),
  substitution.safeExtend(identity),
  playerIn.safeExtend({
    ...identity,
    entryReason: z.literal("powerplay-ended"),
  }),
  powerplayEnd.extend(identity),
  scoreAdjustment.safeExtend({ ...identity, ownDelta: z.literal(0) }),
  shot
    .extend({ ...identity, attemptType: attemptTypeSchema })
    .refine((event) => {
      if (event.attemptType === "open-play") return true;
      const spot = restartSpots[event.attemptType];
      return event.position?.x === spot.x && event.position?.y === spot.y;
    }),
  recoveryFieldsSchema.extend({ ...identity, rinkHalf: rinkHalfSchema }),
  opponentGoal.extend(identity),
  timeout.extend(identity),
  powerplayAdjust.extend(identity),
] as const;

export const versionSixMatchEventInputSchema = z
  .discriminatedUnion("kind", [
    ...expandedEventInputs,
    goalkeeperSave.extend(identity),
  ])
  .refine(
    (event) => event.kind !== "ball-loss" || event.reason !== "poor-reception",
  )
  .refine(
    (event) =>
      event.kind !== "card" ||
      !event.startsPowerplay ||
      event.powerplayDurationMs !== undefined,
  );

export const addMatchEventInputSchema = z
  .discriminatedUnion("kind", [
    ...expandedEventInputs,
    goalkeeperSave.extend({ ...identity, difficulty: saveDifficultySchema }),
  ])
  .refine(
    (event) =>
      event.kind !== "card" ||
      !event.startsPowerplay ||
      event.powerplayDurationMs !== undefined,
  );

const stored = {
  id: z.uuidv4(),
  order: z.int().positive(),
  revision: z.int().positive(),
  createdAt: z.int().positive(),
  updatedAt: z.int().positive(),
  deletedAt: z.int().positive().optional(),
};
export const recoveryEventSchema = recoveryFieldsSchema.extend(stored);
export const matchEventSchema = z
  .discriminatedUnion("kind", [
    recoveryEventSchema,
    loss.extend(stored),
    shot.extend(stored),
    foul.extend(stored),
    card.safeExtend(stored),
    substitution.safeExtend(stored),
    suspensionEnd.extend(stored),
    powerplayEnd.extend(stored),
    powerplayAdjust.extend(stored),
    playerIn.extend(stored),
    playerOut.extend(stored),
    opponentGoal.extend(stored),
    scoreAdjustment.safeExtend(stored),
    goalkeeperSave.extend(stored),
    timeout.extend(stored),
  ])
  .refine(
    (event) =>
      event.capturedAt <= event.createdAt &&
      event.createdAt <= event.updatedAt &&
      (event.deletedAt === undefined ||
        (event.deletedAt >= event.createdAt &&
          event.deletedAt === event.updatedAt)),
  )
  .refine((event) => {
    if (
      event.kind !== "shot" ||
      event.attemptType === undefined ||
      event.attemptType === "open-play"
    )
      return true;
    const spot = restartSpots[event.attemptType];
    return event.position?.x === spot.x && event.position?.y === spot.y;
  });
const matchEventRuleInputSchema = z.discriminatedUnion("kind", [
  loss.extend(identity),
  foul.extend(identity),
  currentCard.safeExtend(identity),
  substitution.safeExtend(identity),
  playerIn.safeExtend({
    ...identity,
    entryReason: z.literal("powerplay-ended"),
  }),
  powerplayEnd.extend(identity),
  scoreAdjustment.safeExtend(identity),
  shot.extend(identity),
  recoveryFieldsSchema.extend(identity),
  opponentGoal.extend(identity),
  goalkeeperSave.extend(identity),
  timeout.extend(identity),
  powerplayAdjust.extend(identity),
]);
export type RinkHalf = z.infer<typeof rinkHalfSchema>;
export type MatchEventRuleInput = z.infer<typeof matchEventRuleInputSchema>;
export type MatchEvent = z.infer<typeof matchEventSchema>;
type AnalysisFields<Event> = Event extends MatchEvent
  ? Omit<
      Event,
      | "id"
      | "matchId"
      | "period"
      | "capturedAt"
      | "gameTime"
      | "order"
      | "revision"
      | "createdAt"
      | "updatedAt"
      | "powerplayCardEventId"
    >
  : never;
export type MatchEventAnalysisInput = AnalysisFields<MatchEvent>;
export type PlayerEventKind = z.infer<typeof playerEventKindSchema>;
export type CardLineupEffect = z.infer<typeof cardLineupEffectSchema>;
export type MatchEventKind = z.infer<typeof matchEventKindSchema>;
export type AddMatchEventInput = z.infer<typeof addMatchEventInputSchema>;
export type RinkPosition = z.infer<typeof rinkPositionSchema>;
export type MatchTime = z.infer<typeof matchTimeSchema>;
export type RecoverySubtype = z.infer<typeof recoverySubtypeSchema>;
export type LossReason = z.infer<typeof lossReasonSchema>;
export type ShotOutcome = z.infer<typeof shotOutcomeSchema>;
export type CardColour = z.infer<typeof cardColourSchema>;
export type AttemptType = z.infer<typeof attemptTypeSchema>;
export type SaveDifficulty = z.infer<typeof saveDifficultySchema>;
export type TimeoutTeam = z.infer<typeof timeoutTeamSchema>;
export function toMatchEventInput(
  event: MatchEvent,
  operationId: string,
): MatchEventRuleInput {
  const { order, revision, createdAt, updatedAt, deletedAt, ...fields } = event;
  void order;
  void revision;
  void createdAt;
  void updatedAt;
  void deletedAt;
  return matchEventRuleInputSchema.parse({ ...fields, operationId });
}
export function eventMatchesInput(
  event: MatchEvent,
  input: AddMatchEventInput,
): boolean {
  try {
    return (
      JSON.stringify(toMatchEventInput(event, input.operationId)) ===
      JSON.stringify(input)
    );
  } catch {
    return false;
  }
}
export function getEventDetail(event: MatchEventAnalysisInput) {
  switch (event.kind) {
    case "ball-recovery":
      return event.subtype;
    case "ball-loss":
      return event.reason;
    case "shot":
      return event.outcome;
    case "card":
      return event.colour;
    case "goalkeeper-save":
      return event.difficulty;
    case "timeout":
      return event.team;
    default:
      return undefined;
  }
}
