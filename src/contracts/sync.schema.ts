import { z } from "zod";
import {
  createPlayerCommandSchema,
  playerAcknowledgementSchema,
  playersDownloadSchema,
} from "./players-sync.schema";
import {
  createTeamCommandSchema,
  teamAcknowledgementSchema,
  teamsDownloadSchema,
} from "./teams-sync.schema";

export const syncCommandSchema = z.discriminatedUnion("kind", [
  createPlayerCommandSchema,
  createTeamCommandSchema,
]);
export type SyncCommand = z.infer<typeof syncCommandSchema>;
export const syncAcknowledgementSchema = z.union([
  playerAcknowledgementSchema,
  teamAcknowledgementSchema,
]);
export type SyncAcknowledgement = z.infer<typeof syncAcknowledgementSchema>;
export type SyncDownload =
  z.infer<typeof playersDownloadSchema> | z.infer<typeof teamsDownloadSchema>;

export function getCommandEntity(command: SyncCommand) {
  switch (command.kind) {
    case "player.create":
      return command.player;
    case "team.create":
      return command.team;
  }
}

export function parseAcknowledgement(
  command: SyncCommand,
  value: unknown,
): SyncAcknowledgement {
  const result =
    command.kind === "player.create"
      ? playerAcknowledgementSchema.parse(value)
      : teamAcknowledgementSchema.parse(value);
  const entity = "player" in result ? result.player : result.team;
  if (
    result.operationId !== command.operationId ||
    entity.id !== getCommandEntity(command).id
  )
    throw new Error("Unexpected operation acknowledgement.");
  return result;
}

export const syncErrorSchema = z.object({
  code: z.enum([
    "authentication_required",
    "account_mismatch",
    "invalid_command",
    "operation_conflict",
    "player_conflict",
    "team_conflict",
    "unavailable",
  ]),
});
