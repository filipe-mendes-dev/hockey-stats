import { z } from "zod";
import { createPlayerCommandSchema } from "../../../contracts/players-sync.schema";
import {
  getCommandEntity,
  syncCommandSchema,
} from "../../../contracts/sync.schema";

export const outboxOperationSchema = z
  .object({
    sequence: z.int().positive().optional(),
    operationId: z.uuidv4(),
    entityId: z.uuidv4(),
    status: z.enum(["pending", "blocked"]),
    errorCode: z.string().optional(),
    command: syncCommandSchema,
  })
  .refine(
    (entry) =>
      entry.operationId === entry.command.operationId &&
      entry.entityId === getCommandEntity(entry.command).id,
  );
export type OutboxOperation = z.infer<typeof outboxOperationSchema>;

export function migrateLegacyOutboxOperation(value: unknown): OutboxOperation {
  const legacy = z
    .object({ playerId: z.uuidv4(), command: createPlayerCommandSchema })
    .loose()
    .parse(value);
  const { playerId, ...record } = legacy;
  return outboxOperationSchema
    .required({ sequence: true })
    .parse({ ...record, entityId: playerId });
}
