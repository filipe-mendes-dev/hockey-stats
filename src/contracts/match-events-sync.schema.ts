import { z } from "zod";
import { matchEventSchema } from "../domain/matches/matchEvent.schema";
const commandFields = {
  version: z.literal(1),
  operationId: z.uuidv4(),
  expectedRevision: z.int().positive(),
  event: matchEventSchema,
};
export const createMatchEventCommandSchema = z
  .object({ ...commandFields, kind: z.literal("matchEvent.create") })
  .refine(
    (command) =>
      command.event.revision === 1 && command.event.deletedAt === undefined,
  );
export const undoMatchEventCommandSchema = z
  .object({ ...commandFields, kind: z.literal("matchEvent.undo") })
  .refine(
    (command) =>
      command.event.revision === 2 && command.event.deletedAt !== undefined,
  );
export const matchEventCommandSchema = z.discriminatedUnion("kind", [
  createMatchEventCommandSchema,
  undoMatchEventCommandSchema,
]);
export type MatchEventCommand = z.infer<typeof matchEventCommandSchema>;
export const matchEventAcknowledgementSchema = z
  .object({
    version: z.literal(1),
    operationId: z.uuidv4(),
    ownerUserId: z.string().min(1),
    acceptedAt: z.int().positive(),
    matchId: z.uuidv4(),
    matchRevision: z.int().positive(),
    event: matchEventSchema,
  })
  .refine((result) => result.matchId === result.event.matchId);
