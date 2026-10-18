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
import { insertTeam } from "../teams/teams.repository";
import {
  getOperationReceipt,
  insertOperationReceipt,
} from "./receipts.repository";

export class SyncConflictError extends Error {
  constructor(
    public readonly code:
      "operation_conflict" | "player_conflict" | "team_conflict",
  ) {
    super(code);
    this.name = "SyncConflictError";
  }
}

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
      command.kind === "player.create"
        ? { ...base, player: command.player }
        : { ...base, team: command.team };
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
      case "player.create":
        if (!(await insertPlayer(transaction, ownerUserId, command.player)))
          throw new SyncConflictError("player_conflict");
        break;
      case "team.create":
        if (!(await insertTeam(transaction, ownerUserId, command.team)))
          throw new SyncConflictError("team_conflict");
        break;
    }
    return result;
  });
}
