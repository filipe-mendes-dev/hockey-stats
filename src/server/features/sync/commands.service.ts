import { applyMatchEventCommand } from "../matches/matchEvents.service";
import "server-only";
import {
  parseAcknowledgement,
  syncCommandSchema,
} from "../../../contracts/sync.schema";
import type {
  SyncCommand,
  SyncAcknowledgement,
} from "../../../contracts/sync.schema";
import { db } from "../../db/client.ts";
import { insertPlayer } from "../players/players.repository";
import {
  hasOwnedMembershipParents,
  insertTeamPlayer,
  updateTeamPlayer,
} from "../teams/teamPlayers.repository";
import { insertTeam, updateTeam } from "../teams/teams.repository";
import {
  getOperationReceipt,
  insertOperationReceipt,
} from "./receipts.repository";

import { applyMatchCommand } from "../matches/matches.service";
import { SyncConflictError } from "./sync.errors";
export { SyncConflictError } from "./sync.errors";

export async function acceptSyncCommand(
  ownerUserId: string,
  command: SyncCommand,
): Promise<SyncAcknowledgement> {
  return db.transaction(async (transaction) => {
    const base = {
      version: 1 as const,
      ownerUserId,
      operationId: command.operationId,
      acceptedAt: Date.now(),
    };
    const result: SyncAcknowledgement =
      "event" in command
        ? {
            ...base,
            matchId: command.event.matchId,
            matchRevision: command.expectedRevision + 1,
            event: command.event,
          }
        : "match" in command
          ? { ...base, match: command.match, players: command.players }
          : command.kind === "player.create"
            ? { ...base, player: command.player }
            : "team" in command
              ? { ...base, team: command.team }
              : { ...base, teamPlayer: command.teamPlayer };
    // The unique receipt reservation serializes concurrent deliveries before the entity insert.
    if (
      !(await insertOperationReceipt(transaction, ownerUserId, command, result))
    ) {
      const receipt = await getOperationReceipt(
        transaction,
        ownerUserId,
        command.operationId,
      );
      if (!receipt)
        throw new Error("The committed operation receipt is unavailable.");
      const original = syncCommandSchema.parse(receipt.command);
      if (JSON.stringify(original) !== JSON.stringify(command))
        throw new SyncConflictError("operation_conflict");
      return parseAcknowledgement(command, receipt.result);
    }
    switch (command.kind) {
      case "matchEvent.create":
      case "matchEvent.undo":
        await applyMatchEventCommand(transaction, ownerUserId, command);
        break;
      case "match.create":
      case "match.updateSetup":
      case "match.start":
        await applyMatchCommand(transaction, ownerUserId, command);
        break;
      case "player.create":
        if (!(await insertPlayer(transaction, ownerUserId, command.player)))
          throw new SyncConflictError("player_conflict");
        break;
      case "team.create":
        if (!(await insertTeam(transaction, ownerUserId, command.team)))
          throw new SyncConflictError("team_conflict");
        break;
      case "team.update":
        if (
          !(await updateTeam(
            transaction,
            ownerUserId,
            command.team,
            command.expectedRevision,
          ))
        )
          throw new SyncConflictError("revision_conflict");
        break;
      case "teamPlayer.create":
        if (
          !(await hasOwnedMembershipParents(
            transaction,
            ownerUserId,
            command.teamPlayer,
          ))
        )
          throw new SyncConflictError("reference_unavailable");
        if (
          !(await insertTeamPlayer(
            transaction,
            ownerUserId,
            command.teamPlayer,
          ))
        )
          throw new SyncConflictError("membership_conflict");
        break;
      case "teamPlayer.update":
        if (
          !(await updateTeamPlayer(
            transaction,
            ownerUserId,
            command.teamPlayer,
            command.expectedRevision,
          ))
        )
          throw new SyncConflictError("revision_conflict");
        break;
    }
    return result;
  });
}
