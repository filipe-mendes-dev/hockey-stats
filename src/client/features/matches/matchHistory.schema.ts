import { z } from "zod";
export const matchHistorySchema = z.strictObject({
  id: z.uuidv4(),
  matchId: z.uuidv4(),
  operationId: z.uuidv4(),
  undoneAt: z.int().positive().optional(),
});
export type MatchHistoryEntry = z.infer<typeof matchHistorySchema>;
