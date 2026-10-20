import { z } from "zod";

export const teamPlayerSchema = z
  .object({
    id: z.uuidv4(),
    teamId: z.uuidv4(),
    playerId: z.uuidv4(),
    jerseyNumber: z
      .string()
      .min(1)
      .refine((number) => number === number.trim())
      .optional(),
    role: z.enum(["field-player", "goalkeeper"]),
    revision: z.int().positive(),
    createdAt: z.int().positive(),
    updatedAt: z.int().positive(),
  })
  .refine((membership) => membership.updatedAt >= membership.createdAt);
export type TeamPlayer = z.infer<typeof teamPlayerSchema>;

export const teamPlayerFieldsSchema = z.object({
  jerseyNumber: z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional()
    .pipe(teamPlayerSchema.shape.jerseyNumber),
  role: teamPlayerSchema.shape.role,
});
export const addTeamPlayersInputSchema = z
  .object({
    teamId: z.uuidv4(),
    players: z
      .array(teamPlayerFieldsSchema.extend({ playerId: z.uuidv4() }))
      .min(1),
  })
  .refine(
    (input) =>
      new Set(input.players.map((player) => player.playerId)).size ===
      input.players.length,
  );
export type AddTeamPlayersInput = z.infer<typeof addTeamPlayersInputSchema>;
export const updateTeamPlayerInputSchema = teamPlayerFieldsSchema.extend({
  id: z.uuidv4(),
  expectedRevision: z.int().positive(),
});
export type UpdateTeamPlayerInput = z.infer<typeof updateTeamPlayerInputSchema>;
