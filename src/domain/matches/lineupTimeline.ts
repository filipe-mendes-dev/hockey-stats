import type { MatchSnapshot } from "./match.schema";
import type { MatchEvent } from "./matchEvent.schema";
import { deriveChronologicalMatchState } from "./derivedMatchState";
import { sortMatchEvents } from "./matchEventOrder";
import { getMatchChronologyIssue } from "./matchChronology";
import type { MatchChronologyIssue } from "./matchChronology";

export interface PlayerStint {
  matchPlayerId: string;
  startMs: number;
  endMs: number;
}

export interface PeriodLineupTimeline {
  period: number;
  extentMs: number;
  stints: readonly PlayerStint[];
  unknownFromMs: number | undefined;
  issue: MatchChronologyIssue | undefined;
}

export interface TeamPlayerStint extends PlayerStint {
  lane: number;
}

export interface TeamPeriodLineupTimeline extends Omit<
  PeriodLineupTimeline,
  "stints"
> {
  stints: readonly TeamPlayerStint[];
}

export function deriveTeamLineupTimeline(
  snapshot: MatchSnapshot,
  events: readonly MatchEvent[],
): readonly TeamPeriodLineupTimeline[] {
  const lanes = new Map<string, number>();
  const starters = snapshot.players
    .filter((player) => player.isStarter)
    .sort(
      (left, right) =>
        Number(right.role === "goalkeeper") -
        Number(left.role === "goalkeeper"),
    );
  starters.forEach((player, lane) => lanes.set(player.id, lane));
  const ordered = sortMatchEvents(events);
  return deriveLineupTimeline(snapshot, events).map((period) => {
    const stints: TeamPlayerStint[] = [];
    const source = [...period.stints].sort(
      (left, right) =>
        left.startMs - right.startMs ||
        (lanes.get(left.matchPlayerId) ?? 5) -
          (lanes.get(right.matchPlayerId) ?? 5),
    );
    for (const stint of source) {
      const occupied = new Set(
        stints
          .filter((entry) => entry.endMs > stint.startMs)
          .map((entry) => entry.lane),
      );
      const replacement = ordered.find(
        (event) =>
          event.period === period.period &&
          event.gameTime?.elapsedMs === stint.startMs &&
          ((event.kind === "substitution" &&
            event.incomingMatchPlayerId === stint.matchPlayerId) ||
            (event.kind === "card" &&
              event.lineupEffect === "replace" &&
              event.replacementMatchPlayerId === stint.matchPlayerId)),
      );
      const outgoing =
        replacement?.kind === "substitution"
          ? replacement.outgoingMatchPlayerId
          : replacement?.kind === "card"
            ? (replacement.removedMatchPlayerId ?? replacement.matchPlayerId)
            : undefined;
      const preferred = outgoing
        ? lanes.get(outgoing)
        : lanes.get(stint.matchPlayerId);
      const lane =
        preferred !== undefined && !occupied.has(preferred)
          ? preferred
          : [0, 1, 2, 3, 4].find((value) => !occupied.has(value));
      if (lane === undefined) continue;
      lanes.set(stint.matchPlayerId, lane);
      stints.push({ ...stint, lane });
    }
    return { ...period, stints };
  });
}

export function deriveLineupTimeline(
  snapshot: MatchSnapshot,
  events: readonly MatchEvent[],
): readonly PeriodLineupTimeline[] {
  const ordered = sortMatchEvents(events);
  const issue = getMatchChronologyIssue(snapshot, events);
  const history: MatchEvent[] = [];
  let active = deriveChronologicalMatchState(snapshot, []).activePlayerIds;
  let uncertain = issue !== undefined && issue.event === undefined;

  return snapshot.match.periods.map((period) => {
    const end = snapshot.match.closedPeriods.find(
      (entry) => entry.number === period.number,
    )?.elapsedMs;
    const periodEvents = ordered.filter(
      (event) => event.period === period.number,
    );
    const lastKnown = Math.max(
      0,
      ...periodEvents.map((event) => event.gameTime?.elapsedMs ?? 0),
    );
    const extentMs = end ?? period.durationMs ?? lastKnown;
    const byPlayer = new Map<string, PlayerStint[]>();
    let cursor = 0;
    let unknownFromMs = uncertain ? 0 : undefined;

    function addInterval(until: number): void {
      if (until <= cursor) return;
      for (const id of active) {
        const stints = byPlayer.get(id) ?? [];
        const last = stints.at(-1);
        if (last?.endMs === cursor) last.endMs = until;
        else stints.push({ matchPlayerId: id, startMs: cursor, endMs: until });
        byPlayer.set(id, stints);
      }
      cursor = until;
    }

    for (const event of periodEvents) {
      if (uncertain) break;
      if (event.id === issue?.event?.id) {
        const at = event.gameTime?.elapsedMs;
        if (at === undefined) byPlayer.clear();
        else addInterval(Math.min(at, extentMs));
        unknownFromMs = at === undefined ? 0 : Math.min(at, extentMs);
        uncertain = true;
        break;
      }
      history.push(event);
      const next = deriveChronologicalMatchState(
        snapshot,
        history,
      ).activePlayerIds;
      if (
        active.size !== next.size ||
        [...active].some((id) => !next.has(id))
      ) {
        if (!event.gameTime) {
          byPlayer.clear();
          unknownFromMs = 0;
          uncertain = true;
          break;
        }
        addInterval(event.gameTime.elapsedMs);
        active = next;
      }
    }
    if (unknownFromMs === undefined) {
      addInterval(end ?? lastKnown);
      if (end === undefined) unknownFromMs = lastKnown;
    }
    return {
      period: period.number,
      extentMs,
      stints: [...byPlayer.values()].flat(),
      unknownFromMs,
      issue: unknownFromMs === undefined ? undefined : issue,
    };
  });
}
