import type { MatchPlayer, MatchSnapshot } from "./match.schema";
import type {
  MatchEventRuleInput,
  MatchEvent,
  PlayerEventKind,
  CardColour,
  CardLineupEffect,
} from "./matchEvent.schema";
import { playerEventKindSchema } from "./matchEvent.schema";
import { deriveMatchState } from "./derivedMatchState";
import type { DerivedMatchState } from "./derivedMatchState";
export const rinkHockeyRules = {
  minimumPlayers: 4,
  maximumPlayers: 5,
  maximumGoalkeepers: 1,
} as const;
export type MatchRuleReason =
  | "match-not-live"
  | "player-unavailable"
  | "player-off-field"
  | "player-on-field"
  | "goalkeeper-event-unavailable"
  | "player-ejected"
  | "invalid-lineup"
  | "too-many-goalkeepers"
  | "invalid-substitution"
  | "invalid-card-effect"
  | "invalid-event-time"
  | "period-changed"
  | "invalid-history"
  | "powerplay-unavailable"
  | "lineup-full";
export type MatchRuleDecision =
  { allowed: true } | { allowed: false; reason: MatchRuleReason };
export interface MatchRuleContext {
  snapshot: MatchSnapshot;
  state: DerivedMatchState;
}
export class MatchRuleError extends Error {
  constructor(public readonly reason: MatchRuleReason) {
    super(reason);
    this.name = "MatchRuleError";
  }
}
const allowed: MatchRuleDecision = { allowed: true };
function reject(reason: MatchRuleReason): MatchRuleDecision {
  return { allowed: false, reason };
}
function playerAvailable(
  context: MatchRuleContext,
  playerId: string,
): MatchRuleDecision {
  if (!context.snapshot.players.some((player) => player.id === playerId))
    return reject("player-unavailable");
  if (context.state.ejectedPlayerIds.has(playerId))
    return reject("player-ejected");
  return allowed;
}
export function getLineupDecision(
  snapshot: MatchSnapshot,
  active: ReadonlySet<string>,
  maximumPlayers: number = rinkHockeyRules.maximumPlayers,
): MatchRuleDecision {
  if (
    active.size < rinkHockeyRules.minimumPlayers ||
    active.size > maximumPlayers ||
    [...active].some(
      (id) => !snapshot.players.some((player) => player.id === id),
    )
  )
    return reject("invalid-lineup");
  if (
    snapshot.players.filter(
      (player) => active.has(player.id) && player.role === "goalkeeper",
    ).length > rinkHockeyRules.maximumGoalkeepers
  )
    return reject("too-many-goalkeepers");
  return allowed;
}
export function getSubstitutionDecision(
  context: MatchRuleContext,
  outgoingId: string,
  incomingId: string,
): MatchRuleDecision {
  if (context.snapshot.match.status !== "live") return reject("match-not-live");
  if (
    outgoingId === incomingId ||
    !context.state.activePlayerIds.has(outgoingId)
  )
    return reject("invalid-substitution");
  const available = playerAvailable(context, incomingId);
  if (!available.allowed) return available;
  if (context.state.activePlayerIds.has(incomingId))
    return reject("player-on-field");
  const next = new Set(context.state.activePlayerIds);
  next.delete(outgoingId);
  next.add(incomingId);
  return getLineupDecision(context.snapshot, next, context.state.maxOnField);
}
export function getSubstitutionPartners(
  context: MatchRuleContext,
  playerId: string,
): MatchPlayer[] {
  const outgoing = context.state.activePlayerIds.has(playerId);
  return context.snapshot.players.filter(
    (player) =>
      getSubstitutionDecision(
        context,
        outgoing ? playerId : player.id,
        outgoing ? player.id : playerId,
      ).allowed,
  );
}
export function getEventEligibility(
  context: MatchRuleContext,
  kind: PlayerEventKind,
  playerId: string,
): MatchRuleDecision {
  if (context.snapshot.match.status !== "live") return reject("match-not-live");
  const player = context.snapshot.players.find(
    (entry) => entry.id === playerId,
  );
  if (!player) return reject("player-unavailable");
  if (kind === "substitution")
    return getSubstitutionPartners(context, playerId).length > 0
      ? allowed
      : reject("invalid-substitution");
  const available = playerAvailable(context, playerId);
  if (!available.allowed) return available;
  if (kind === "card") return allowed;
  if (kind === "player-in") {
    if (context.state.activePlayerIds.has(playerId))
      return reject("player-on-field");
    if (context.state.isPowerplay || context.state.activePlayerIds.size !== 4)
      return reject("lineup-full");
    return getLineupDecision(
      context.snapshot,
      new Set([...context.state.activePlayerIds, playerId]),
      context.state.maxOnField,
    );
  }
  if (!context.state.activePlayerIds.has(playerId))
    return reject("player-off-field");
  if (
    player.role === "goalkeeper" &&
    (kind === "ball-recovery" || kind === "ball-loss" || kind === "shot")
  )
    return reject("goalkeeper-event-unavailable");
  return allowed;
}
export function getEligiblePlayers(
  context: MatchRuleContext,
  kind: PlayerEventKind,
): MatchPlayer[] {
  return context.snapshot.players.filter(
    (player) => getEventEligibility(context, kind, player.id).allowed,
  );
}
export function getAvailableEventKinds(
  context: MatchRuleContext,
  playerId?: string,
): PlayerEventKind[] {
  return playerEventKindSchema.options.filter((kind) =>
    playerId === undefined
      ? getEligiblePlayers(context, kind).length > 0
      : getEventEligibility(context, kind, playerId).allowed,
  );
}
export function getCardReplacementPlayers(
  context: MatchRuleContext,
  playerId: string,
): MatchPlayer[] {
  return context.snapshot.players.filter(
    (player) => getSubstitutionDecision(context, playerId, player.id).allowed,
  );
}
export function getCardLineupEffect(
  context: MatchRuleContext,
  playerId: string,
  colour: CardColour,
): CardLineupEffect | null {
  if (!getEventEligibility(context, "card", playerId).allowed) return null;
  if (colour === "yellow") return "none";
  if (context.state.activePlayerIds.size > rinkHockeyRules.minimumPlayers)
    return "remove";
  if (!context.state.activePlayerIds.has(playerId)) return "none";
  return getCardReplacementPlayers(context, playerId).length > 0
    ? "replace"
    : null;
}
export function getCardRemovalPlayers(
  context: MatchRuleContext,
  playerId: string,
): MatchPlayer[] {
  return context.snapshot.players.filter(
    (player) =>
      context.state.activePlayerIds.has(player.id) &&
      (!context.state.activePlayerIds.has(playerId) || player.id === playerId),
  );
}

export function isValidEventForMatch(
  snapshot: MatchSnapshot,
  event: MatchEvent,
): boolean {
  const period = snapshot.match.periods.find(
    (entry) => entry.number === event.period,
  );
  const ids = [
    "matchPlayerId" in event ? event.matchPlayerId : undefined,
    event.kind === "substitution" ? event.outgoingMatchPlayerId : undefined,
    event.kind === "substitution" ? event.incomingMatchPlayerId : undefined,
    event.kind === "card" ? event.replacementMatchPlayerId : undefined,
    event.kind === "card" ? event.removedMatchPlayerId : undefined,
  ].filter((id): id is string => id !== undefined);
  return (
    event.matchId === snapshot.match.id &&
    period !== undefined &&
    ids.every((id) => snapshot.players.some((player) => player.id === id)) &&
    (event.gameTime === undefined ||
      period.durationMs === undefined ||
      event.gameTime.elapsedMs <= period.durationMs)
  );
}
export function validateMatchEvent(
  context: MatchRuleContext,
  input: MatchEventRuleInput,
): MatchRuleDecision {
  if (context.snapshot.match.status !== "live") return reject("match-not-live");
  if (input.period !== context.snapshot.match.currentPeriod)
    return reject("period-changed");
  const period = context.snapshot.match.periods.find(
    (entry) => entry.number === input.period,
  );
  if (
    !period ||
    (input.gameTime &&
      period.durationMs !== undefined &&
      input.gameTime.elapsedMs > period.durationMs)
  )
    return reject("invalid-event-time");
  if (!context.state.valid) return reject("invalid-history");
  const lineup = getLineupDecision(
    context.snapshot,
    context.state.activePlayerIds,
    context.state.maxOnField,
  );
  if (!lineup.allowed) return lineup;
  switch (input.kind) {
    case "powerplay-adjust":
    case "powerplay-end":
      return context.state.powerplayCardEventIds[0] ===
        input.powerplayCardEventId
        ? allowed
        : reject("powerplay-unavailable");
    case "player-in":
      return getEventEligibility(context, "player-in", input.matchPlayerId);
    case "substitution":
      return getSubstitutionDecision(
        context,
        input.outgoingMatchPlayerId,
        input.incomingMatchPlayerId,
      );
    case "card": {
      const eligibility = getEventEligibility(
        context,
        "card",
        input.matchPlayerId,
      );
      if (!eligibility.allowed) return eligibility;
      const effect = getCardLineupEffect(
        context,
        input.matchPlayerId,
        input.colour,
      );
      if (effect === null || input.lineupEffect !== effect)
        return reject("invalid-card-effect");
      if (effect === "remove") {
        if (
          !input.removedMatchPlayerId ||
          !getCardRemovalPlayers(context, input.matchPlayerId).some(
            (player) => player.id === input.removedMatchPlayerId,
          )
        )
          return reject("invalid-card-effect");
        const next = new Set(context.state.activePlayerIds);
        next.delete(input.removedMatchPlayerId);
        return getLineupDecision(
          context.snapshot,
          next,
          rinkHockeyRules.minimumPlayers,
        );
      }
      if (effect === "replace")
        return input.replacementMatchPlayerId
          ? getSubstitutionDecision(
              context,
              input.matchPlayerId,
              input.replacementMatchPlayerId,
            )
          : reject("invalid-card-effect");
      return allowed;
    }
    case "ball-recovery":
    case "ball-loss":
    case "shot":
    case "team-foul":
      return getEventEligibility(context, input.kind, input.matchPlayerId);
    default:
      return allowed;
  }
}
export function validateEventHistory(
  snapshot: MatchSnapshot,
  events: readonly MatchEvent[],
): MatchRuleDecision {
  const state = deriveMatchState(snapshot, events);
  return state.valid
    ? getLineupDecision(snapshot, state.activePlayerIds, state.maxOnField)
    : reject("invalid-history");
}
