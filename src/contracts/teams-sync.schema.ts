import { z } from "zod";
import { teamSchema } from "../domain/teams/team.schema";
import { teamPlayerSchema } from "../domain/teams/teamPlayer.schema";

export const createTeamCommandSchema = z.object({
  version: z.literal(1),
  operationId: z.uuidv4(),
  kind: z.literal("team.create"),
  team: teamSchema.refine(
    (team) => team.revision === 1 && team.archivedAt === undefined,
  ),
});
export type CreateTeamCommand = z.infer<typeof createTeamCommandSchema>;

export const updateTeamCommandSchema = z
  .object({
    version: z.literal(1),
    operationId: z.uuidv4(),
    kind: z.literal("team.update"),
    expectedRevision: z.int().positive(),
    team: teamSchema,
  })
  .refine(
    (command) =>
      command.team.revision === command.expectedRevision + 1 &&
      command.team.archivedAt === undefined,
  );
export type UpdateTeamCommand = z.infer<typeof updateTeamCommandSchema>;

export const createTeamPlayerCommandSchema = z.object({
  version: z.literal(1),
  operationId: z.uuidv4(),
  kind: z.literal("teamPlayer.create"),
  teamPlayer: teamPlayerSchema.refine(
    (membership) => membership.revision === 1,
  ),
});
export const updateTeamPlayerCommandSchema = z
  .object({
    version: z.literal(1),
    operationId: z.uuidv4(),
    kind: z.literal("teamPlayer.update"),
    expectedRevision: z.int().positive(),
    teamPlayer: teamPlayerSchema,
  })
  .refine(
    (command) => command.teamPlayer.revision === command.expectedRevision + 1,
  );

export const teamAcknowledgementSchema = z.object({
  version: z.literal(1),
  ownerUserId: z.string().min(1),
  operationId: z.uuidv4(),
  team: teamSchema,
  acceptedAt: z.int().positive(),
});
export type TeamAcknowledgement = z.infer<typeof teamAcknowledgementSchema>;

export const teamPlayerAcknowledgementSchema = z.object({
  version: z.literal(1),
  ownerUserId: z.string().min(1),
  operationId: z.uuidv4(),
  teamPlayer: teamPlayerSchema,
  acceptedAt: z.int().positive(),
});

export const teamsDownloadSchema = z.object({
  version: z.literal(1),
  ownerUserId: z.string().min(1),
  teams: z.array(teamSchema),
});
export type TeamsDownload = z.infer<typeof teamsDownloadSchema>;

export const teamPlayersDownloadSchema = z.object({
  version: z.literal(1),
  ownerUserId: z.string().min(1),
  teamPlayers: z.array(teamPlayerSchema),
});
