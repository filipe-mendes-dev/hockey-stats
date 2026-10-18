import {
  createMatchCommandSchema,
  updateMatchSetupCommandSchema,
  startMatchCommandSchema,
  matchAcknowledgementSchema,
  matchesDownloadSchema,
} from "./matches-sync.schema";
import { z } from "zod";
import {
  createPlayerCommandSchema,
  playerAcknowledgementSchema,
  playersDownloadSchema,
} from "./players-sync.schema";
import {
  createTeamCommandSchema,
  updateTeamCommandSchema,
  createTeamPlayerCommandSchema,
  updateTeamPlayerCommandSchema,
  teamPlayerAcknowledgementSchema,
  teamPlayersDownloadSchema,
  teamAcknowledgementSchema,
  teamsDownloadSchema,
} from "./teams-sync.schema";

export const syncCommandSchema = z.discriminatedUnion("kind", [
  createPlayerCommandSchema,
  createTeamCommandSchema,
  updateTeamCommandSchema,
  createTeamPlayerCommandSchema,
  updateTeamPlayerCommandSchema,
  createMatchCommandSchema,
  updateMatchSetupCommandSchema,
  startMatchCommandSchema,
]);
export type SyncCommand = z.infer<typeof syncCommandSchema>;
export const syncAcknowledgementSchema = z.union([
  playerAcknowledgementSchema,
  teamAcknowledgementSchema,
  teamPlayerAcknowledgementSchema,
  matchAcknowledgementSchema,
]);
export type SyncAcknowledgement = z.infer<typeof syncAcknowledgementSchema>;
export type SyncDownload =
  | z.infer<typeof playersDownloadSchema>
  | z.infer<typeof teamsDownloadSchema>
  | z.infer<typeof teamPlayersDownloadSchema>
  | z.infer<typeof matchesDownloadSchema>;

export function getCommandEntity(command: SyncCommand) {
  switch (command.kind) {
    case "match.create":
    case "match.updateSetup":
    case "match.start":
      return command.match;
    case "player.create":
      return command.player;
    case "team.create":
    case "team.update":
      return command.team;
    case "teamPlayer.create":
    case "teamPlayer.update":
      return command.teamPlayer;
  }
}

export function parseAcknowledgement(
  command: SyncCommand,
  value: unknown,
): SyncAcknowledgement {
  const result =
    "match" in command
      ? matchAcknowledgementSchema.parse(value)
      : getCommandFeature(command) === "players"
        ? playerAcknowledgementSchema.parse(value)
        : getCommandFeature(command) === "teams"
          ? teamAcknowledgementSchema.parse(value)
          : teamPlayerAcknowledgementSchema.parse(value);
  const entity =
    "match" in result
      ? result.match
      : "player" in result
        ? result.player
        : "team" in result
          ? result.team
          : result.teamPlayer;
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
    "match_conflict",
    "revision_conflict",
    "membership_conflict",
    "reference_unavailable",
    "unavailable",
  ]),
});

export function getCommandFeature(
  command: SyncCommand,
): "players" | "teams" | "teamPlayers" | "matches" {
  switch (command.kind) {
    case "match.create":
    case "match.updateSetup":
    case "match.start":
      return "matches";
    case "player.create":
      return "players";
    case "team.create":
    case "team.update":
      return "teams";
    case "teamPlayer.create":
    case "teamPlayer.update":
      return "teamPlayers";
  }
}
