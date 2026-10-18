import { z } from "zod";
import {
  teamPlayerSchema,
  teamPlayerFieldsSchema,
} from "../teams/teamPlayer.schema";

export const matchCallUpLimits = {
  fieldPlayers: 8,
  goalkeepers: 2,
  total: 10,
} as const;
export const matchPeriodSchema = z.object({
  number: z.int().positive(),
  durationMs: z.int().positive().optional(),
  attackDirection: z.enum(["toward-x0", "toward-x1", "unknown"]),
});
export const matchPeriodsSchema = z
  .array(matchPeriodSchema)
  .refine((periods) =>
    periods.every((period, index) => period.number === index + 1),
  );
export const matchSchema = z
  .object({
    id: z.uuidv4(),
    teamId: z.uuidv4(),
    teamNameAtMatch: z
      .string()
      .min(1)
      .refine((value) => value === value.trim()),
    opponentName: z
      .string()
      .min(1)
      .refine((value) => value === value.trim()),
    scheduledDate: z.iso
      .date()
      .refine((date) => !date.startsWith("0000-"))
      .optional(),
    venueRole: z.enum(["home", "away", "neutral"]).optional(),
    status: z.enum(["setup", "live"]),
    periods: matchPeriodsSchema.default([]),
    startedAt: z.int().positive().optional(),
    revision: z.int().positive(),
    createdAt: z.int().positive(),
    updatedAt: z.int().positive(),
  })
  .refine((match) => match.updatedAt >= match.createdAt);
export type Match = z.infer<typeof matchSchema>;
export const matchPlayerSchema = z.object({
  id: z.uuidv4(),
  matchId: z.uuidv4(),
  playerId: z.uuidv4(),
  playerNameAtMatch: z
    .string()
    .min(1)
    .refine((value) => value === value.trim()),
  jerseyNumber: teamPlayerSchema.shape.jerseyNumber,
  role: teamPlayerSchema.shape.role,
  isStarter: z.boolean(),
});
export type MatchPlayer = z.infer<typeof matchPlayerSchema>;

export function isValidMatchCallUp(
  players: ReadonlyArray<{ role: MatchPlayer["role"] }>,
): boolean {
  return (
    players.filter((player) => player.role === "field-player").length <=
      matchCallUpLimits.fieldPlayers &&
    players.filter((player) => player.role === "goalkeeper").length <=
      matchCallUpLimits.goalkeepers
  );
}
export const matchSnapshotSchema = z
  .object({
    match: matchSchema,
    players: z.array(matchPlayerSchema).max(matchCallUpLimits.total),
  })
  .refine(
    (snapshot) =>
      snapshot.players.every(
        (player) => player.matchId === snapshot.match.id,
      ) &&
      new Set(snapshot.players.map((player) => player.id)).size ===
        snapshot.players.length &&
      new Set(snapshot.players.map((player) => player.playerId)).size ===
        snapshot.players.length &&
      isValidMatchCallUp(snapshot.players) &&
      (snapshot.match.status === "setup"
        ? snapshot.players.every((player) => !player.isStarter) &&
          snapshot.match.startedAt === undefined &&
          snapshot.match.periods.length === 0
        : snapshot.match.startedAt !== undefined &&
          snapshot.match.startedAt >= snapshot.match.createdAt &&
          snapshot.match.startedAt <= snapshot.match.updatedAt &&
          snapshot.match.periods.length > 0 &&
          snapshot.players.filter(
            (player) => player.isStarter && player.role === "field-player",
          ).length === 4 &&
          snapshot.players.filter(
            (player) => player.isStarter && player.role === "goalkeeper",
          ).length === 1),
  );
export type MatchSnapshot = z.infer<typeof matchSnapshotSchema>;
export const createMatchInputSchema = z.object({
  teamId: z.uuidv4(),
  opponentName: z.string().trim().pipe(matchSchema.shape.opponentName),
  scheduledDate: z
    .string()
    .transform((value) => value || undefined)
    .optional()
    .pipe(matchSchema.shape.scheduledDate),
  venueRole: z
    .string()
    .transform((value) => value || undefined)
    .optional()
    .pipe(matchSchema.shape.venueRole),
  players: z
    .array(teamPlayerFieldsSchema.extend({ playerId: z.uuidv4() }))
    .max(matchCallUpLimits.total)
    .refine(
      (players) =>
        new Set(players.map((player) => player.playerId)).size ===
          players.length && isValidMatchCallUp(players),
    ),
});
export type CreateMatchInput = z.infer<typeof createMatchInputSchema>;

export const updateMatchSetupInputSchema = createMatchInputSchema.extend({
  id: z.uuidv4(),
  expectedRevision: z.int().positive(),
});
export type UpdateMatchSetupInput = z.infer<typeof updateMatchSetupInputSchema>;
export const startMatchInputSchema = z.object({
  id: z.uuidv4(),
  expectedRevision: z.int().positive(),
  starterIds: z
    .array(z.uuidv4())
    .length(5)
    .refine((ids) => new Set(ids).size === ids.length),
  periods: matchPeriodsSchema.refine((periods) => periods.length > 0),
});
export type StartMatchInput = z.infer<typeof startMatchInputSchema>;
