import { z } from "zod";
import { teamSchema } from "../team.schema";

function normalizeOptionalText(value: string): string | undefined {
  return value.trim() || undefined;
}

export const createTeamInputSchema = z.object({
  name: z.string().trim().pipe(teamSchema.shape.name),
  category: z
    .string()
    .transform(normalizeOptionalText)
    .optional()
    .pipe(teamSchema.shape.category),
  season: z
    .string()
    .transform(normalizeOptionalText)
    .optional()
    .pipe(teamSchema.shape.season),
});

export type CreateTeamInput = z.infer<typeof createTeamInputSchema>;
