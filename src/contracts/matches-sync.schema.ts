import { isValidEventForMatch } from "../domain/matches/matchRules";
import { z } from "zod";
import { matchControlActionSchema } from "../domain/matches/matchControl";
import {
  deriveMatchState,
  deriveChronologicalMatchState,
} from "../domain/matches/derivedMatchState";
import { matchEventSchema } from "../domain/matches/matchEvent.schema";
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
export const matchRecordingSchema = matchSnapshotSchema
  .safeExtend({ events: z.array(matchEventSchema) })
  .refine(
    (snapshot) =>
      (snapshot.match.status !== "setup" || snapshot.events.length === 0) &&
      (deriveMatchState(snapshot, snapshot.events).valid ||
        deriveChronologicalMatchState(snapshot, snapshot.events).valid) &&
      new Set(snapshot.events.map((event) => event.id)).size ===
        snapshot.events.length &&
      [...snapshot.events]
        .sort((a, b) => a.order - b.order)
        .every((event, index) => event.order === index + 1) &&
      snapshot.events.every(
        (event) =>
          event.matchId === snapshot.match.id &&
          isValidEventForMatch(snapshot, event) &&
          snapshot.match.periods.some(
            (period) => period.number === event.period,
          ),
      ),
  );
export type MatchRecording = z.infer<typeof matchRecordingSchema>;
export const matchesDownloadSchema = z.object({
  version: z.literal(1),
  ownerUserId: z.string().min(1),
  matches: z
    .array(matchRecordingSchema)
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
      command.match.status === "live" &&
      command.match.currentPeriod === 1 &&
      command.match.closedPeriods.length === 0 &&
      command.match.clock?.runningSince === undefined &&
      (command.match.clock?.elapsedMs ?? 0) === 0,
  );
export const controlMatchCommandSchema = matchSnapshotSchema
  .safeExtend({
    version: z.union([z.literal(1), z.literal(2)]),
    operationId: z.uuidv4(),
    kind: z.literal("match.control"),
    expectedRevision: z.int().positive(),
    action: matchControlActionSchema,
  })
  .refine(
    (command) =>
      command.match.revision === command.expectedRevision + 1 &&
      command.match.status !== "setup",
  );
export const matchCommandSchema = z.discriminatedUnion("kind", [
  createMatchCommandSchema,
  updateMatchSetupCommandSchema,
  startMatchCommandSchema,
  controlMatchCommandSchema,
]);
export type MatchCommand = z.infer<typeof matchCommandSchema>;
