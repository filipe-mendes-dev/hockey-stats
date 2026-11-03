import { z } from "zod";
import type { Match, MatchPlayer, MatchSnapshot } from "./match.schema";
import type { MatchEvent } from "./matchEvent.schema";
import { deriveChronologicalMatchState } from "./derivedMatchState";
import { InvalidMatchControlError } from "./matchControl";
import { getLineupDecision, MatchRuleError } from "./matchRules";
import type { RinkAttackDirection } from "./rinkPosition";

export const nextMatchPeriodInputSchema = z.strictObject({
  id: z.uuidv4(),
  expectedRevision: z.int().positive(),
  attackDirection: z.enum(["toward-x0", "toward-x1"]),
  playerIds: z
    .array(z.uuidv4())
    .min(4)
    .max(5)
    .refine((ids) => new Set(ids).size === ids.length),
});
export type NextMatchPeriodInput = z.infer<typeof nextMatchPeriodInputSchema>;

export interface PeriodSubstitution {
  outgoingMatchPlayerId: string;
  incomingMatchPlayerId: string;
}

export function getNextAttackDirection(
  match: Match,
): RinkAttackDirection | undefined {
  const current = match.periods.find(
    (period) => period.number === match.currentPeriod,
  )?.attackDirection;
  return current === "toward-x0"
    ? "toward-x1"
    : current === "toward-x1"
      ? "toward-x0"
      : undefined;
}

function goalkeeperFirst(left: MatchPlayer, right: MatchPlayer): number {
  return (
    Number(right.role === "goalkeeper") - Number(left.role === "goalkeeper")
  );
}

export function getPeriodSubstitutions(
  snapshot: MatchSnapshot,
  events: readonly MatchEvent[],
  playerIds: readonly string[],
): readonly PeriodSubstitution[] {
  const state = deriveChronologicalMatchState(snapshot, events, {
    period: snapshot.match.currentPeriod,
    gameTime: { elapsedMs: 0 },
  });
  const selected = new Set(playerIds);
  if (
    !state.valid ||
    selected.size !== playerIds.length ||
    selected.size !== state.activePlayerIds.size ||
    playerIds.some((id) => state.ejectedPlayerIds.has(id))
  )
    throw new InvalidMatchControlError();
  const decision = getLineupDecision(snapshot, selected, state.maxOnField);
  if (!decision.allowed) throw new MatchRuleError(decision.reason);
  const outgoing = snapshot.players
    .filter(
      (player) =>
        state.activePlayerIds.has(player.id) && !selected.has(player.id),
    )
    .sort(goalkeeperFirst);
  const incoming = snapshot.players
    .filter(
      (player) =>
        selected.has(player.id) && !state.activePlayerIds.has(player.id),
    )
    .sort(goalkeeperFirst);
  return outgoing.map((player, index) => {
    const replacement = incoming[index];
    if (!replacement) throw new InvalidMatchControlError();
    return {
      outgoingMatchPlayerId: player.id,
      incomingMatchPlayerId: replacement.id,
    };
  });
}
