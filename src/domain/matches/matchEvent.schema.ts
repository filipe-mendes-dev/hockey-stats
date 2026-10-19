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
  "player-in",
  "player-out",
]);
export const matchEventKindSchema = z.enum([
  ...playerEventKindSchema.options,
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
const spatial = { ...player, position: rinkPositionSchema.optional() };
export const recoveryFieldsSchema = z.strictObject({
  ...spatial,
  kind: playerEventKindSchema.extract(["ball-recovery"]),
  subtype: recoverySubtypeSchema,
});
const loss = z.strictObject({
  ...spatial,
  kind: playerEventKindSchema.extract(["ball-loss"]),
  reason: lossReasonSchema,
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
const card = z.strictObject({
  ...spatial,
  kind: playerEventKindSchema.extract(["card"]),
  colour: cardColourSchema,
});
const playerIn = z.strictObject({
  ...player,
  kind: playerEventKindSchema.extract(["player-in"]),
  gameTime: matchTimeSchema,
});
const playerOut = z.strictObject({
  ...player,
  kind: playerEventKindSchema.extract(["player-out"]),
  gameTime: matchTimeSchema,
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
export const addMatchEventInputSchema = z.discriminatedUnion("kind", [
  recoveryFieldsSchema.extend(identity),
  loss.extend(identity),
  shot.extend(identity),
  foul.extend(identity),
  card.extend(identity),
  playerIn.extend(identity),
  playerOut.extend(identity),
  opponentGoal.extend(identity),
  scoreAdjustment.safeExtend(identity),
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
    card.extend(stored),
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
export type MatchEvent = z.infer<typeof matchEventSchema>;
export type MatchEventKind = z.infer<typeof matchEventKindSchema>;
export type AddMatchEventInput = z.infer<typeof addMatchEventInputSchema>;
export type RinkPosition = z.infer<typeof rinkPositionSchema>;
export type MatchTime = z.infer<typeof matchTimeSchema>;
export type RecoverySubtype = z.infer<typeof recoverySubtypeSchema>;
export type LossReason = z.infer<typeof lossReasonSchema>;
export type ShotOutcome = z.infer<typeof shotOutcomeSchema>;
export type CardColour = z.infer<typeof cardColourSchema>;
export function eventMatchesInput(
  event: MatchEvent,
  input: AddMatchEventInput,
): boolean {
  const { order, revision, createdAt, updatedAt, deletedAt, ...fields } = event;
  void order;
  void revision;
  void createdAt;
  void updatedAt;
  void deletedAt;
  return (
    JSON.stringify(
      addMatchEventInputSchema.parse({
        ...fields,
        operationId: input.operationId,
      }),
    ) === JSON.stringify(input)
  );
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
