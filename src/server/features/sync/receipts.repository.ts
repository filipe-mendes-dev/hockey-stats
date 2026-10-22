import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type {
  SyncCommand,
  SyncAcknowledgement,
} from "../../../contracts/sync.schema";
import { operationReceipts } from "../../db/sync_schema.ts";
import type { DatabaseTransaction } from "../../db/client.ts";

export async function getOperationReceipt(
  transaction: DatabaseTransaction,
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
  transaction: DatabaseTransaction,
  ownerUserId: string,
  command: SyncCommand,
  result: SyncAcknowledgement,
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

export async function updateOperationReceiptResult(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  operationId: string,
  result: SyncAcknowledgement,
): Promise<void> {
  await transaction
    .update(operationReceipts)
    .set({ result })
    .where(
      and(
        eq(operationReceipts.ownerUserId, ownerUserId),
        eq(operationReceipts.operationId, operationId),
      ),
    );
}

export async function lockEntityWrites(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  feature: string,
  id: string,
): Promise<void> {
  const key = `${ownerUserId}:${feature}:${id}`;
  await transaction.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`,
  );
}
