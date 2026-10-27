import type { MatchSnapshot } from "./match.schema";
import type { MatchEvent } from "./matchEvent.schema";
import { deriveChronologicalMatchState } from "./derivedMatchState";
import { getMatchEventsAtTime, sortMatchEvents } from "./matchEventOrder";
import {
  getLineupDecision,
  isValidEventForMatch,
  validateMatchEvent,
} from "./matchRules";
import type { MatchRuleDecision, MatchRuleReason } from "./matchRules";

export interface MatchChronologyIssue {
  event: MatchEvent | undefined;
  reason: MatchRuleReason;
}

export function validateChronologicalEventHistory(
  snapshot: MatchSnapshot,
  events: readonly MatchEvent[],
): MatchRuleDecision {
  const issue = getMatchChronologyIssue(snapshot, events);
  return issue ? { allowed: false, reason: issue.reason } : { allowed: true };
}

export function getMatchChronologyIssue(
  snapshot: MatchSnapshot,
  events: readonly MatchEvent[],
): MatchChronologyIssue | undefined {
  const initial = getLineupDecision(
    snapshot,
    deriveChronologicalMatchState(snapshot, []).activePlayerIds,
  );
  if (!initial.allowed) return { event: undefined, reason: initial.reason };
  const history: MatchEvent[] = [];
  for (const event of sortMatchEvents(events)) {
    if (
      event.kind === "card" &&
      event.colour !== "yellow" &&
      event.lineupEffect === undefined
    )
      return { event, reason: "unknown-history-time" };
    const end = snapshot.match.closedPeriods.find(
      (period) => period.number === event.period,
    )?.elapsedMs;
    if (
      !isValidEventForMatch(snapshot, event) ||
      (event.gameTime && end !== undefined && event.gameTime.elapsedMs > end)
    )
      return { event, reason: "invalid-event-time" };

    const state = deriveChronologicalMatchState(snapshot, history, event);
    if (!state.valid) return { event, reason: "invalid-history" };
    const context = {
      snapshot: {
        ...snapshot,
        match: {
          ...snapshot.match,
          status: "live" as const,
          currentPeriod: event.period,
        },
      },
      state,
    };
    // Untimed actions cannot establish when a player acted. Legacy cards may lack lineup effects.
    if (
      event.gameTime &&
      !(event.kind === "card" && event.lineupEffect === undefined)
    ) {
      const decision = validateMatchEvent(context, event);
      if (!decision.allowed) return { event, reason: decision.reason };
    }
    history.push(event);
    const next = deriveChronologicalMatchState(snapshot, history);
    if (!next.valid) return { event, reason: "invalid-history" };
    const lineup = getLineupDecision(
      snapshot,
      next.activePlayerIds,
      next.maxOnField,
    );
    if (!lineup.allowed) return { event, reason: lineup.reason };
  }
  return undefined;
}

export function validateChronologicalEventAddition(
  snapshot: MatchSnapshot,
  events: readonly MatchEvent[],
  event: MatchEvent,
): MatchRuleDecision {
  const samePeriod = events.filter(
    (entry) => entry.deletedAt === undefined && entry.period === event.period,
  );
  const elapsedMs = event.gameTime?.elapsedMs;
  const backdated =
    elapsedMs !== undefined &&
    samePeriod.some(
      (entry) =>
        entry.gameTime !== undefined && entry.gameTime.elapsedMs > elapsedMs,
    );
  if (backdated && samePeriod.some((entry) => entry.gameTime === undefined))
    return { allowed: false, reason: "unknown-history-time" };
  const eligibility = validateMatchEvent(
    {
      snapshot,
      state: deriveChronologicalMatchState(
        snapshot,
        getMatchEventsAtTime(events, event),
        event,
      ),
    },
    event,
  );
  if (!eligibility.allowed) return eligibility;
  const decision = validateChronologicalEventHistory(snapshot, [
    ...events,
    event,
  ]);
  return decision.allowed || decision.reason === "unknown-history-time"
    ? decision
    : { allowed: false, reason: "chronology-conflict" };
}
