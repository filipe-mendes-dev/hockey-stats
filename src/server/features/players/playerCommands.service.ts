import "server-only";
import {
  createPlayerCommandSchema,
  playerAcknowledgementSchema,
} from "../../../contracts/players-sync.schema";
import type {
  CreatePlayerCommand,
  PlayerAcknowledgement,
} from "../../../contracts/players-sync.schema";
import { db } from "../../db/client.ts";
import { insertPlayer } from "./players.repository";
import {
  getOperationReceipt,
  insertOperationReceipt,
} from "../sync/receipts.repository";

export class SyncConflictError extends Error {
  constructor(public readonly code: "operation_conflict" | "player_conflict") {
    super(code);
    this.name = "SyncConflictError";
  }
}

export async function acceptPlayerCreation(
  ownerUserId: string,
  command: CreatePlayerCommand,
): Promise<PlayerAcknowledgement> {
  return db.transaction(async (transaction) => {
    const result: PlayerAcknowledgement = {
      version: 1,
      ownerUserId,
      operationId: command.operationId,
      player: command.player,
      acceptedAt: Date.now(),
    };
    // The unique receipt reservation serializes concurrent deliveries before the player insert.
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
      const original = createPlayerCommandSchema.parse(receipt.command);
      if (JSON.stringify(original) !== JSON.stringify(command))
        throw new SyncConflictError("operation_conflict");
      return playerAcknowledgementSchema.parse(receipt.result);
    }
    if (!(await insertPlayer(transaction, ownerUserId, command.player)))
      throw new SyncConflictError("player_conflict");
    return result;
  });
}
