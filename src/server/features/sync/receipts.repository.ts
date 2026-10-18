import "server-only";
import { and, eq } from "drizzle-orm";
import type {
  CreatePlayerCommand,
  PlayerAcknowledgement,
} from "../../../contracts/players-sync.schema";
import { operationReceipts } from "../../db/players_schema.ts";
import type { PlayerTransaction } from "../players/players.repository";

export async function getOperationReceipt(
  transaction: PlayerTransaction,
  ownerUserId: string,
  operationId: string,
) {
  const [receipt] = await transaction
    .select()
    .from(operationReceipts)
    .where(
      and(
        eq(operationReceipts.ownerUserId, ownerUserId),
        eq(operationReceipts.operationId, operationId),
      ),
    );
  return receipt ?? null;
}

export async function insertOperationReceipt(
  transaction: PlayerTransaction,
  ownerUserId: string,
  command: CreatePlayerCommand,
  result: PlayerAcknowledgement,
): Promise<boolean> {
  const rows = await transaction
    .insert(operationReceipts)
    .values({
      ownerUserId,
      operationId: command.operationId,
      command,
      result,
      acceptedAt: result.acceptedAt,
    })
    .onConflictDoNothing()
    .returning({ operationId: operationReceipts.operationId });
  return rows.length === 1;
}
