import {
  deletePlayerCommandSchema,
  deleteTeamCommandSchema,
  deleteTeamPlayerCommandSchema,
  deleteMatchCommandSchema,
  deletionAcknowledgementSchema,
  deletionsDownloadSchema,
  getDeletionFeature,
} from "./entity-deletions.schema";
import {
  createMatchEventCommandSchema,
  undoMatchEventCommandSchema,
  matchEventAcknowledgementSchema,
} from "./match-events-sync.schema";
import {
  createMatchCommandSchema,
  updateMatchSetupCommandSchema,
  startMatchCommandSchema,
  controlMatchCommandSchema,
  matchAcknowledgementSchema,
  matchesDownloadSchema,
} from "./matches-sync.schema";
import { z } from "zod";
import {
  createPlayerCommandSchema,
  updatePlayerCommandSchema,
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
  deletePlayerCommandSchema,
  deleteTeamCommandSchema,
  deleteTeamPlayerCommandSchema,
  deleteMatchCommandSchema,
  createPlayerCommandSchema,
  updatePlayerCommandSchema,
  createTeamCommandSchema,
  updateTeamCommandSchema,
  createTeamPlayerCommandSchema,
  updateTeamPlayerCommandSchema,
  createMatchCommandSchema,
  updateMatchSetupCommandSchema,
  startMatchCommandSchema,
  controlMatchCommandSchema,
  createMatchEventCommandSchema,
  undoMatchEventCommandSchema,
]);
export type SyncCommand = z.infer<typeof syncCommandSchema>;
export const syncAcknowledgementSchema = z.union([
  deletionAcknowledgementSchema,
  playerAcknowledgementSchema,
  teamAcknowledgementSchema,
  teamPlayerAcknowledgementSchema,
  matchAcknowledgementSchema,
  matchEventAcknowledgementSchema,
]);
export type SyncAcknowledgement = z.infer<typeof syncAcknowledgementSchema>;
export type SyncDownload =
  | z.infer<typeof deletionsDownloadSchema>
  | z.infer<typeof playersDownloadSchema>
  | z.infer<typeof teamsDownloadSchema>
  | z.infer<typeof teamPlayersDownloadSchema>
  | z.infer<typeof matchesDownloadSchema>;

export function getCommandEntity(command: SyncCommand) {
  switch (command.kind) {
    case "player.delete":
    case "team.delete":
    case "teamPlayer.delete":
    case "match.delete":
      return { id: command.id };
    case "matchEvent.create":
    case "matchEvent.undo":
      return { id: command.event.matchId };
    case "match.create":
    case "match.updateSetup":
    case "match.start":
    case "match.control":
      return command.match;
    case "player.create":
    case "player.update":
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
  if ("deletedAt" in command) {
    const result = deletionAcknowledgementSchema.parse(value);
    const primary = result.deletions.find(
      (entry) =>
        entry.feature === getDeletionFeature(command) &&
        entry.id === command.id,
    );
    if (
      result.operationId !== command.operationId ||
      !primary ||
      primary.revision !== command.expectedRevision + 1 ||
      primary.deletedAt !== command.deletedAt
    )
      throw new Error("Unexpected deletion acknowledgement.");
    return result;
  }
  if ("event" in command) {
    const result = matchEventAcknowledgementSchema.parse(value);
    if (
      result.operationId !== command.operationId ||
      result.matchId !== command.event.matchId ||
      result.matchRevision !== command.expectedRevision + 1 ||
      JSON.stringify(result.event) !== JSON.stringify(command.event)
    )
      throw new Error("Unexpected event acknowledgement.");
    return result;
  }
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
    "event_conflict",
    "revision_conflict",
    "membership_conflict",
    "reference_unavailable",
    "record_deleted",
    "unavailable",
  ]),
});

export function getCommandFeature(
  command: Pick<SyncCommand, "kind">,
): "players" | "teams" | "teamPlayers" | "matches" {
  switch (command.kind) {
    case "player.delete":
      return "players";
    case "team.delete":
      return "teams";
    case "teamPlayer.delete":
      return "teamPlayers";
    case "match.delete":
      return "matches";
    case "matchEvent.create":
    case "matchEvent.undo":
    case "match.create":
    case "match.updateSetup":
    case "match.start":
    case "match.control":
      return "matches";
    case "player.create":
    case "player.update":
      return "players";
    case "team.create":
    case "team.update":
      return "teams";
    case "teamPlayer.create":
    case "teamPlayer.update":
      return "teamPlayers";
  }
}
