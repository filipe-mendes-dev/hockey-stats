import { z } from "zod";
import { teamSchema } from "../domain/teams/team.schema";

export const createTeamCommandSchema = z.object({
  version: z.literal(1),
  operationId: z.uuidv4(),
  kind: z.literal("team.create"),
  team: teamSchema.refine(
    (team) => team.revision === 1 && team.archivedAt === undefined,
  ),
});
export type CreateTeamCommand = z.infer<typeof createTeamCommandSchema>;

export const teamAcknowledgementSchema = z.object({
  version: z.literal(1),
  ownerUserId: z.string().min(1),
  operationId: z.uuidv4(),
  team: teamSchema,
  acceptedAt: z.int().positive(),
});
export type TeamAcknowledgement = z.infer<typeof teamAcknowledgementSchema>;

export const teamsDownloadSchema = z.object({
  version: z.literal(1),
  ownerUserId: z.string().min(1),
  teams: z.array(teamSchema),
});
export type TeamsDownload = z.infer<typeof teamsDownloadSchema>;
