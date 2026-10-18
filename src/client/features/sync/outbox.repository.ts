import { getDatabase } from "../../storage/database";
import { outboxOperationSchema } from "./outbox.schema";
import type { OutboxOperation } from "./outbox.schema";

export async function listOutboxOperations(): Promise<OutboxOperation[]> {
  const database = await getDatabase();
  const rows = await database
    .table<unknown, number>("outbox")
    .orderBy("sequence")
    .toArray();
  return rows.map((row) => outboxOperationSchema.parse(row));
}

export async function getOutboxOperation(
  operationId: string,
): Promise<OutboxOperation | null> {
  const database = await getDatabase();
  const row: unknown = await database
    .table<unknown, number>("outbox")
    .where("operationId")
    .equals(operationId)
    .first();
  return row === undefined ? null : outboxOperationSchema.parse(row);
}

export async function insertOutboxOperation(
  operation: OutboxOperation,
): Promise<void> {
  const database = await getDatabase();
  await database.table<OutboxOperation, number>("outbox").add(operation);
}

export async function blockOutboxOperation(
  operationId: string,
  errorCode: string,
): Promise<void> {
  const database = await getDatabase();
  await database
    .table<OutboxOperation, number>("outbox")
    .where("operationId")
    .equals(operationId)
    .modify({ status: "blocked", errorCode });
}

export async function deleteOutboxOperation(
  operationId: string,
): Promise<void> {
  const database = await getDatabase();
  await database
    .table<OutboxOperation, number>("outbox")
    .where("operationId")
    .equals(operationId)
    .delete();
}
