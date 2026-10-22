import { z } from "zod";
import { playerSchema } from "../domain/players/player.schema";

export const createPlayerCommandSchema = z.object({
  version: z.literal(1),
  operationId: z.uuidv4(),
  kind: z.literal("player.create"),
  player: playerSchema.refine(
    (player) => player.revision === 1 && player.archivedAt === undefined,
  ),
});
export type CreatePlayerCommand = z.infer<typeof createPlayerCommandSchema>;

export const updatePlayerCommandSchema = z
  .object({
    version: z.literal(1),
    operationId: z.uuidv4(),
    kind: z.literal("player.update"),
    expectedRevision: z.int().positive(),
    player: playerSchema,
  })
  .refine(
    (command) =>
      command.player.revision === command.expectedRevision + 1 &&
      command.player.archivedAt === undefined,
  );
export type UpdatePlayerCommand = z.infer<typeof updatePlayerCommandSchema>;

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
