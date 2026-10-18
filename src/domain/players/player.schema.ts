import { z } from "zod";
import { playerNameSchema } from "./validation/player.rules";

export const playerSchema = z
  .object({
    id: z.uuidv4(),
    name: playerNameSchema,
    revision: z.int().positive(),
    createdAt: z.int().positive(),
    updatedAt: z.int().positive(),
    archivedAt: z.int().positive().optional(),
  })
  .refine((player) => player.updatedAt >= player.createdAt);

export type Player = z.infer<typeof playerSchema>;
