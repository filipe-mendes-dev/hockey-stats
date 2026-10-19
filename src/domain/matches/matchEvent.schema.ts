import { z } from "zod";

export const rinkPositionSchema = z.strictObject({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});
export const matchTimeSchema = z.strictObject({
  elapsedMs: z.int().nonnegative(),
});
export const recoverySubtypeSchema = z.enum([
  "interception",
  "duel",
  "loose-ball",
  "other",
]);
export const recoveryFieldsSchema = z.strictObject({
  matchId: z.uuidv4(),
  matchPlayerId: z.uuidv4(),
  kind: z.literal("ball-recovery"),
  subtype: recoverySubtypeSchema,
  period: z.int().positive(),
  capturedAt: z.int().positive(),
  gameTime: matchTimeSchema.optional(),
  position: rinkPositionSchema.optional(),
});
export const addMatchEventInputSchema = recoveryFieldsSchema.extend({
  id: z.uuidv4(),
  operationId: z.uuidv4(),
});
export const recoveryEventSchema = recoveryFieldsSchema
  .extend({
    id: z.uuidv4(),
    order: z.int().positive(),
    revision: z.int().positive(),
    createdAt: z.int().positive(),
    updatedAt: z.int().positive(),
    deletedAt: z.int().positive().optional(),
  })
  .refine(
    (event) =>
      event.capturedAt <= event.createdAt &&
      event.createdAt <= event.updatedAt &&
      (event.deletedAt === undefined ||
        (event.deletedAt >= event.createdAt &&
          event.deletedAt === event.updatedAt)),
  );
export const matchEventSchema = z.discriminatedUnion("kind", [
  recoveryEventSchema,
]);
export type MatchEvent = z.infer<typeof matchEventSchema>;
export type AddMatchEventInput = z.infer<typeof addMatchEventInputSchema>;
export type RinkPosition = z.infer<typeof rinkPositionSchema>;
export type MatchTime = z.infer<typeof matchTimeSchema>;
export type RecoverySubtype = z.infer<typeof recoverySubtypeSchema>;

export function eventMatchesInput(
  event: MatchEvent,
  input: AddMatchEventInput,
): boolean {
  return (
    JSON.stringify(recoveryFieldsSchema.parse(eventFields(event))) ===
    JSON.stringify(recoveryFieldsSchema.parse(eventFields(input)))
  );
}
function eventFields(event: z.infer<typeof recoveryFieldsSchema>) {
  return {
    matchId: event.matchId,
    matchPlayerId: event.matchPlayerId,
    kind: event.kind,
    subtype: event.subtype,
    period: event.period,
    capturedAt: event.capturedAt,
    gameTime: event.gameTime,
    position: event.position,
  };
}
