import { z } from "zod";

export const playerSchema = z
  .object({
    id: z.uuidv4(),
    name: z
      .string()
      .min(1)
      .refine((name) => name === name.trim()),
    revision: z.int().positive(),
    createdAt: z.int().positive(),
    updatedAt: z.int().positive(),
    archivedAt: z.int().positive().optional(),
  })
  .refine((player) => player.updatedAt >= player.createdAt);

export type Player = z.infer<typeof playerSchema>;
