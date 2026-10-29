import { z } from "zod";
import {
  matchPeriodSchema,
  matchPlayerSchema,
  matchSchema,
} from "../domain/matches/match.schema";
import {
  attemptTypeSchema,
  cardColourSchema,
  cardLineupEffectSchema,
  lossReasonSchema,
  matchTimeSchema,
  recoverySubtypeSchema,
  rinkHalfSchema,
  rinkPositionSchema,
  saveDifficultySchema,
  shotOutcomeSchema,
  timeoutTeamSchema,
} from "../domain/matches/matchEvent.schema";

export const statisticsPlayerSchema = matchPlayerSchema.pick({
  id: true,
  playerNameAtMatch: true,
  jerseyNumber: true,
  role: true,
});
export const statisticsMatchSchema = z.object({
  teamNameAtMatch: z.string(),
  opponentName: z.string(),
  scheduledDate: z.iso.date().optional(),
  venueRole: matchSchema.shape.venueRole,
  status: z.literal("completed"),
  periods: z.array(matchPeriodSchema),
});
const eventBase = {
  id: z.uuidv4(),
  order: z.int().positive(),
  period: z.int().positive(),
  gameTime: matchTimeSchema.optional(),
  deletedAt: z.never().optional(),
  onRink: z.boolean(),
  thirdBlueRed: z.boolean(),
};
const player = { ...eventBase, matchPlayerId: z.uuidv4() };
const spatial = { ...player, position: rinkPositionSchema.optional() };
export const statisticsEventSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    ...spatial,
    kind: z.literal("ball-recovery"),
    subtype: recoverySubtypeSchema,
    rinkHalf: rinkHalfSchema.optional(),
  }),
  z.strictObject({
    ...spatial,
    kind: z.literal("ball-loss"),
    reason: lossReasonSchema,
    rinkHalf: rinkHalfSchema.optional(),
  }),
  z.strictObject({
    ...spatial,
    kind: z.literal("shot"),
    outcome: shotOutcomeSchema,
    attemptType: attemptTypeSchema.optional(),
  }),
  z.strictObject({ ...spatial, kind: z.literal("team-foul") }),
  z.strictObject({
    ...spatial,
    kind: z.literal("card"),
    colour: cardColourSchema,
    lineupEffect: cardLineupEffectSchema.optional(),
    removedMatchPlayerId: z.uuidv4().optional(),
    replacementMatchPlayerId: z.uuidv4().optional(),
  }),
  z.strictObject({
    ...eventBase,
    kind: z.literal("substitution"),
    outgoingMatchPlayerId: z.uuidv4(),
    incomingMatchPlayerId: z.uuidv4(),
  }),
  z.strictObject({ ...player, kind: z.literal("suspension-end") }),
  z.strictObject({ ...eventBase, kind: z.literal("powerplay-end") }),
  z.strictObject({
    ...eventBase,
    kind: z.literal("powerplay-adjust"),
    powerplayDurationMs: z.int().positive(),
  }),
  z.strictObject({ ...player, kind: z.literal("player-in") }),
  z.strictObject({ ...player, kind: z.literal("player-out") }),
  z.strictObject({
    ...eventBase,
    kind: z.literal("opponent-goal"),
    matchPlayerId: z.uuidv4().optional(),
  }),
  z.strictObject({
    ...eventBase,
    kind: z.literal("score-adjustment"),
    ownDelta: z.int(),
    opponentDelta: z.int(),
  }),
  z.strictObject({
    ...player,
    kind: z.literal("goalkeeper-save"),
    difficulty: saveDifficultySchema.optional(),
  }),
  z.strictObject({
    ...eventBase,
    kind: z.literal("timeout"),
    team: timeoutTeamSchema,
  }),
]);
const count = z.int().nonnegative();
const shotType = z.strictObject({ attempts: count, goals: count });
const actionStatisticsSchema = z.strictObject({
  shots: count,
  goals: count,
  onTarget: count,
  offTarget: count,
  blocked: count,
  recoveries: count,
  losses: count,
  fouls: count,
  cards: z.strictObject({ yellow: count, blue: count, red: count }),
  shotTypes: z.strictObject({
    "open-play": shotType,
    penalty: shotType,
    "direct-free-hit": shotType,
    unknown: shotType,
  }),
  saves: count,
  simpleSaves: count,
  difficultSaves: count,
  unclassifiedSaves: count,
  concededGoals: count,
  unattributedConcededGoals: count,
  timeouts: z.strictObject({ own: count, opponent: count }),
});
const periodScoreSchema = z.strictObject({
  period: z.int().positive(),
  own: z.int(),
  opponent: z.int(),
  reliable: z.boolean(),
});
const statisticsSchema = z.strictObject({
  team: actionStatisticsSchema,
  players: z.array(
    actionStatisticsSchema.extend({
      player: statisticsPlayerSchema,
      playingTimeMs: count.optional(),
    }),
  ),
  periodScores: z.array(periodScoreSchema),
});
const timelineSchema = z.strictObject({
  period: z.int().positive(),
  extentMs: count,
  unknownFromMs: count.optional(),
  stints: z.array(
    z.strictObject({
      matchPlayerId: z.uuidv4(),
      startMs: count,
      endMs: count,
      lane: count.max(4),
    }),
  ),
  issue: z
    .strictObject({
      reason: z.enum([
        "match-not-live",
        "player-unavailable",
        "player-off-field",
        "player-on-field",
        "goalkeeper-event-unavailable",
        "player-ejected",
        "invalid-lineup",
        "too-many-goalkeepers",
        "invalid-substitution",
        "invalid-card-effect",
        "invalid-event-time",
        "period-changed",
        "invalid-history",
        "chronology-conflict",
        "unknown-history-time",
        "powerplay-unavailable",
        "lineup-full",
      ]),
      event: z
        .strictObject({
          period: z.int().positive(),
          order: z.int().positive(),
          gameTime: matchTimeSchema.optional(),
        })
        .optional(),
    })
    .optional(),
});
export const matchStatisticsViewSchema = z.strictObject({
  match: statisticsMatchSchema,
  players: z.array(statisticsPlayerSchema),
  category: z.string().optional(),
  score: z.strictObject({ own: count, opponent: count }),
  statistics: z.array(
    z.strictObject({
      period: z.int().positive().optional(),
      values: statisticsSchema,
    }),
  ),
  events: z.array(statisticsEventSchema),
  timelines: z.array(timelineSchema),
});
export type MatchStatisticsView = z.infer<typeof matchStatisticsViewSchema>;
export type StatisticsEvent = z.infer<typeof statisticsEventSchema>;
export type StatisticsPlayer = z.infer<typeof statisticsPlayerSchema>;
export type StatisticsMatch = z.infer<typeof statisticsMatchSchema>;
export type StatisticsValues = z.infer<typeof statisticsSchema>;
export type StatisticsPlayerValues = StatisticsValues["players"][number];
export type StatisticsTimeline = z.infer<typeof timelineSchema>;
