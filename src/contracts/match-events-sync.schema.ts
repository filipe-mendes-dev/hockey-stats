import { z } from "zod";
import {
  matchEventSchema,
  addMatchEventInputSchema,
  toMatchEventInput,
} from "../domain/matches/matchEvent.schema";
import type { MatchEvent } from "../domain/matches/matchEvent.schema";
const commandFields = {
  version: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  operationId: z.uuidv4(),
  expectedRevision: z.int().positive(),
  event: matchEventSchema,
};
export const createMatchEventCommandSchema = z
  .object({ ...commandFields, kind: z.literal("matchEvent.create") })
  .refine(
    (command) =>
      command.event.revision === 1 &&
      command.event.deletedAt === undefined &&
      (command.version === 4
        ? isCurrentEvent(command.event, command.operationId, true)
        : command.version === 3
          ? !usesEventContextProtocol(command.event) &&
            isCurrentEvent(command.event, command.operationId, false)
          : command.version === 2
            ? isVersionTwoEvent(command.event)
            : isLegacyEvent(command.event)),
  );
export const undoMatchEventCommandSchema = z
  .object({ ...commandFields, kind: z.literal("matchEvent.undo") })
  .refine(
    (command) =>
      command.event.revision === 2 &&
      command.event.deletedAt !== undefined &&
      (command.version >= 3 ||
        (command.version === 2
          ? !usesPowerplayProtocol(command.event)
          : isLegacyEvent(command.event))),
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

function isLegacyEvent(event: MatchEvent): boolean {
  return (
    !usesEventContextProtocol(event) &&
    !usesPowerplayProtocol(event) &&
    event.kind !== "substitution" &&
    event.kind !== "suspension-end" &&
    (event.kind !== "card" || event.lineupEffect === undefined)
  );
}
function isCurrentEvent(
  event: MatchEvent,
  operationId: string,
  current: boolean,
): boolean {
  try {
    const input = toMatchEventInput(event, operationId);
    if (current) addMatchEventInputSchema.parse(input);
    return true;
  } catch {
    return false;
  }
}

export function usesPowerplayProtocol(event: MatchEvent): boolean {
  return (
    event.kind === "powerplay-end" ||
    (event.kind === "card" && event.startsPowerplay !== undefined) ||
    (event.kind === "player-in" && event.entryReason !== undefined)
  );
}
function isVersionTwoEvent(event: MatchEvent): boolean {
  return (
    !usesEventContextProtocol(event) &&
    !usesPowerplayProtocol(event) &&
    event.kind !== "player-in" &&
    event.kind !== "player-out" &&
    (event.kind !== "card" || event.lineupEffect !== undefined)
  );
}

export function usesEventContextProtocol(event: MatchEvent): boolean {
  return (
    (event.kind === "ball-recovery" || event.kind === "ball-loss") &&
    event.rinkHalf !== undefined
  );
}
