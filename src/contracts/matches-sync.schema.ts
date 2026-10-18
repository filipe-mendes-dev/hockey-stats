import { z } from "zod";
import { matchSnapshotSchema } from "../domain/matches/match.schema";
export const createMatchCommandSchema = matchSnapshotSchema
  .safeExtend({
    version: z.literal(1),
    operationId: z.uuidv4(),
    kind: z.literal("match.create"),
  })
  .refine(
    (command) =>
      command.match.revision === 1 && command.match.status === "setup",
  );
export const matchAcknowledgementSchema = matchSnapshotSchema.safeExtend({
  version: z.literal(1),
  ownerUserId: z.string().min(1),
  operationId: z.uuidv4(),
  acceptedAt: z.int().positive(),
});
export const matchesDownloadSchema = z.object({
  version: z.literal(1),
  ownerUserId: z.string().min(1),
  matches: z
    .array(matchSnapshotSchema)
    .refine(
      (snapshots) =>
        new Set(snapshots.map((snapshot) => snapshot.match.id)).size ===
        snapshots.length,
    ),
});

export const updateMatchSetupCommandSchema = matchSnapshotSchema
  .safeExtend({
    version: z.literal(1),
    operationId: z.uuidv4(),
    kind: z.literal("match.updateSetup"),
    expectedRevision: z.int().positive(),
  })
  .refine(
    (command) =>
      command.match.revision === command.expectedRevision + 1 &&
      command.match.status === "setup",
  );
export const startMatchCommandSchema = matchSnapshotSchema
  .safeExtend({
    version: z.literal(1),
    operationId: z.uuidv4(),
    kind: z.literal("match.start"),
    expectedRevision: z.int().positive(),
  })
  .refine(
    (command) =>
      command.match.revision === command.expectedRevision + 1 &&
      command.match.status === "live",
  );
export const matchCommandSchema = z.discriminatedUnion("kind", [
  createMatchCommandSchema,
  updateMatchSetupCommandSchema,
  startMatchCommandSchema,
]);
export type MatchCommand = z.infer<typeof matchCommandSchema>;
