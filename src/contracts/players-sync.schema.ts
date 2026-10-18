import { z } from "zod";
import { playerSchema } from "../domain/players/player.schema";

export const accountSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  username: z.string().nullable().optional(),
});
export type LocalAccount = z.infer<typeof accountSchema>;

export const createPlayerCommandSchema = z.object({
  version: z.literal(1),
  operationId: z.uuidv4(),
  kind: z.literal("player.create"),
  player: playerSchema.refine(
    (player) => player.revision === 1 && player.archivedAt === undefined,
  ),
});
export type CreatePlayerCommand = z.infer<typeof createPlayerCommandSchema>;

export const playerAcknowledgementSchema = z.object({
  version: z.literal(1),
  ownerUserId: z.string().min(1),
  operationId: z.uuidv4(),
  player: playerSchema,
  acceptedAt: z.int().positive(),
});
export type PlayerAcknowledgement = z.infer<typeof playerAcknowledgementSchema>;

export const playersDownloadSchema = z.object({
  version: z.literal(1),
  ownerUserId: z.string().min(1),
  players: z.array(playerSchema),
});

export const syncErrorSchema = z.object({
  code: z.enum([
    "authentication_required",
    "account_mismatch",
    "invalid_command",
    "operation_conflict",
    "player_conflict",
    "unavailable",
  ]),
});
