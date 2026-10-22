import { z } from "zod";

export const deletionFeatureSchema = z.enum([
  "players",
  "teams",
  "teamPlayers",
  "matches",
]);
export const entityDeletionSchema = z.object({
  feature: deletionFeatureSchema,
  id: z.uuidv4(),
  revision: z.int().positive(),
  deletedAt: z.int().positive(),
});
export type EntityDeletion = z.infer<typeof entityDeletionSchema>;
export type DeletionFeature = EntityDeletion["feature"];
export const deleteEntityInputSchema = z.object({
  feature: deletionFeatureSchema,
  id: z.uuidv4(),
  expectedRevision: z.int().positive(),
});
export type DeleteEntityInput = z.infer<typeof deleteEntityInputSchema>;
const deletionFields = z.object({
  version: z.literal(1),
  operationId: z.uuidv4(),
  id: z.uuidv4(),
  expectedRevision: z.int().positive(),
  deletedAt: z.int().positive(),
});
export const deletePlayerCommandSchema = deletionFields.extend({
  kind: z.literal("player.delete"),
});
export const deleteTeamCommandSchema = deletionFields.extend({
  kind: z.literal("team.delete"),
});
export const deleteTeamPlayerCommandSchema = deletionFields.extend({
  kind: z.literal("teamPlayer.delete"),
});
export const deleteMatchCommandSchema = deletionFields.extend({
  kind: z.literal("match.delete"),
});
export const deleteEntityCommandSchema = z.discriminatedUnion("kind", [
  deletePlayerCommandSchema,
  deleteTeamCommandSchema,
  deleteTeamPlayerCommandSchema,
  deleteMatchCommandSchema,
]);
export type DeleteEntityCommand = z.infer<typeof deleteEntityCommandSchema>;
export const deletionAcknowledgementSchema = z.object({
  version: z.literal(1),
  ownerUserId: z.string().min(1),
  operationId: z.uuidv4(),
  acceptedAt: z.int().positive(),
  deletions: z.array(entityDeletionSchema).min(1),
});
export type DeletionAcknowledgement = z.infer<
  typeof deletionAcknowledgementSchema
>;
export const deletionsDownloadSchema = z.object({
  version: z.literal(1),
  ownerUserId: z.string().min(1),
  deletions: z.array(entityDeletionSchema),
});
export function getDeletionFeature(
  command: DeleteEntityCommand,
): DeletionFeature {
  switch (command.kind) {
    case "player.delete":
      return "players";
    case "team.delete":
      return "teams";
    case "teamPlayer.delete":
      return "teamPlayers";
    case "match.delete":
      return "matches";
  }
}
