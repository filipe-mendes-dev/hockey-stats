import { z } from "zod";
import { createPlayerCommandSchema } from "../../../contracts/players-sync.schema";

export const outboxOperationSchema = z
  .object({
    sequence: z.int().positive().optional(),
    operationId: z.uuidv4(),
    playerId: z.uuidv4(),
    status: z.enum(["pending", "blocked"]),
    errorCode: z.string().optional(),
    command: createPlayerCommandSchema,
  })
  .refine(
    (entry) =>
      entry.operationId === entry.command.operationId &&
      entry.playerId === entry.command.player.id,
  );
export type OutboxOperation = z.infer<typeof outboxOperationSchema>;
