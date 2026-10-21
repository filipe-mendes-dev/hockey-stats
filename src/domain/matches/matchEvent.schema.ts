import { z } from "zod";
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
]);
export const matchEventKindSchema = z.enum([
  ...playerEventKindSchema.options,
  "suspension-end",
  "powerplay-end",
  "player-out",
  "opponent-goal",
  "score-adjustment",
]);
export const recoverySubtypeSchema = z.enum([
  "interception",
  "duel",
  "loose-ball",
  "other",
]);
export const lossReasonSchema = z.enum([
  "intercepted-pass",
  "failed-individual-action",
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
const shot = z.strictObject({
  ...spatial,
  kind: playerEventKindSchema.extract(["shot"]),
  outcome: shotOutcomeSchema,
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
    removedMatchPlayerId: z.uuidv4().optional(),
    replacementMatchPlayerId: z.uuidv4().optional(),
  })
  .refine((event) => {
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
const opponentGoal = z.strictObject({
  ...base,
  kind: matchEventKindSchema.extract(["opponent-goal"]),
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
  shot.extend(identity),
  foul.extend(identity),
  currentCard.safeExtend(identity),
  substitution.safeExtend(identity),
  playerIn.safeExtend({
    ...identity,
    entryReason: z.literal("powerplay-ended"),
  }),
  powerplayEnd.extend(identity),
  opponentGoal.extend(identity),
] as const;
export const versionThreeMatchEventInputSchema = z.discriminatedUnion("kind", [
  recoveryFieldsSchema.extend(identity),
  loss.extend(identity),
  ...commonEventInputs,
  scoreAdjustment.safeExtend(identity),
]);
export const addMatchEventInputSchema = z.discriminatedUnion("kind", [
  recoveryFieldsSchema.extend({ ...identity, rinkHalf: rinkHalfSchema }),
  loss.extend({ ...identity, rinkHalf: rinkHalfSchema }),
  ...commonEventInputs,
  scoreAdjustment.safeExtend({ ...identity, ownDelta: z.literal(0) }),
]);

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
    playerIn.extend(stored),
    playerOut.extend(stored),
    opponentGoal.extend(stored),
    scoreAdjustment.safeExtend(stored),
  ])
  .refine(
    (event) =>
      event.capturedAt <= event.createdAt &&
      event.createdAt <= event.updatedAt &&
      (event.deletedAt === undefined ||
        (event.deletedAt >= event.createdAt &&
          event.deletedAt === event.updatedAt)),
  );
export type RinkHalf = z.infer<typeof rinkHalfSchema>;
export type MatchEventRuleInput = z.infer<
  typeof versionThreeMatchEventInputSchema
>;
export type MatchEvent = z.infer<typeof matchEventSchema>;
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
  return versionThreeMatchEventInputSchema.parse({ ...fields, operationId });
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
export function getEventDetail(event: MatchEvent) {
  switch (event.kind) {
    case "ball-recovery":
      return event.subtype;
    case "ball-loss":
      return event.reason;
    case "shot":
      return event.outcome;
    case "card":
      return event.colour;
    default:
      return undefined;
  }
}
