import { z } from "zod";

const optionalTextSchema = z
  .string()
  .min(1)
  .refine((value) => value === value.trim())
  .optional();

export const teamSchema = z
  .object({
    id: z.uuidv4(),
    name: z
      .string()
      .min(1)
      .refine((name) => name === name.trim()),
    category: optionalTextSchema,
    season: optionalTextSchema,
    revision: z.int().positive(),
    createdAt: z.int().positive(),
    updatedAt: z.int().positive(),
    archivedAt: z.int().positive().optional(),
  })
  .refine((team) => team.updatedAt >= team.createdAt);

export type Team = z.infer<typeof teamSchema>;
