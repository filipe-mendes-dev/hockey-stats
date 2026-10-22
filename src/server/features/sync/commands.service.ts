import { applyDeletionCommand } from "../removal/removal.service";
import { getOwnedDeletion } from "../removal/deletions.repository";
import { getDeletionFeature } from "../../../contracts/entity-deletions.schema";
import {
  getCommandFeature,
  getCommandEntity,
} from "../../../contracts/sync.schema";
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
import { insertPlayer, updatePlayer } from "../players/players.repository";
import {
  hasOwnedMembershipParents,
  insertTeamPlayer,
  updateTeamPlayer,
} from "../teams/teamPlayers.repository";
import { insertTeam, updateTeam } from "../teams/teams.repository";
import {
  getOperationReceipt,
  insertOperationReceipt,
  updateOperationReceiptResult,
  lockEntityWrites,
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
    let result: SyncAcknowledgement =
      "deletedAt" in command
        ? {
            ...base,
            deletions: [
              {
                feature: getDeletionFeature(command),
                id: command.id,
                revision: command.expectedRevision + 1,
                deletedAt: command.deletedAt,
              },
            ],
          }
        : "event" in command
          ? {
              ...base,
              matchId: command.event.matchId,
              matchRevision: command.expectedRevision + 1,
              event: command.event,
            }
          : "match" in command
            ? { ...base, match: command.match, players: command.players }
            : "player" in command
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
    await lockEntityWrites(
      transaction,
      ownerUserId,
      getCommandFeature(command),
      getCommandEntity(command).id,
    );
    if (
      await getOwnedDeletion(
        transaction,
        ownerUserId,
        getCommandFeature(command),
        getCommandEntity(command).id,
      )
    )
      throw new SyncConflictError("record_deleted");
    switch (command.kind) {
      case "player.delete":
      case "team.delete":
      case "teamPlayer.delete":
      case "match.delete":
        result = {
          ...base,
          deletions: await applyDeletionCommand(
            transaction,
            ownerUserId,
            command,
          ),
        };
        await updateOperationReceiptResult(
          transaction,
          ownerUserId,
          command.operationId,
          result,
        );
        break;
      case "matchEvent.create":
      case "matchEvent.undo":
        await applyMatchEventCommand(transaction, ownerUserId, command);
        break;
      case "match.create":
      case "match.updateSetup":
      case "match.start":
      case "match.control":
        await applyMatchCommand(transaction, ownerUserId, command);
        break;
      case "player.create":
        if (!(await insertPlayer(transaction, ownerUserId, command.player)))
          throw new SyncConflictError("player_conflict");
        break;
      case "player.update":
        if (
          !(await updatePlayer(
            transaction,
            ownerUserId,
            command.player,
            command.expectedRevision,
          ))
        )
          throw new SyncConflictError("revision_conflict");
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
          !(await hasOwnedMembershipParents(
            transaction,
            ownerUserId,
            command.teamPlayer,
          ))
        )
          throw new SyncConflictError("reference_unavailable");
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
