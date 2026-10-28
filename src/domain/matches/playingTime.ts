import type { MatchEvent } from "./matchEvent.schema";
import type { MatchSnapshot } from "./match.schema";
import { deriveChronologicalMatchState } from "./derivedMatchState";
import { sortMatchEvents } from "./matchEventOrder";
import { validateChronologicalEventHistory } from "./matchChronology";

export interface PeriodPlayingTime {
  period: number;
  players: ReadonlyMap<string, number> | undefined;
}

function changesLineup(event: MatchEvent): boolean {
  return (
    event.kind === "substitution" ||
    event.kind === "player-in" ||
    event.kind === "player-out" ||
    (event.kind === "card" &&
      event.colour !== "yellow" &&
      event.lineupEffect !== undefined &&
      event.lineupEffect !== "none")
  );
}

function samePlayers(
  left: ReadonlySet<string>,
  right: ReadonlySet<string>,
): boolean {
  return left.size === right.size && [...left].every((id) => right.has(id));
}

export function derivePlayingTime(
  snapshot: MatchSnapshot,
  events: readonly MatchEvent[],
): readonly PeriodPlayingTime[] {
  const ordered = sortMatchEvents(events);
  let active = deriveChronologicalMatchState(snapshot, []).activePlayerIds;
  const history: MatchEvent[] = [];
  let lineupReliable = true;

  return snapshot.match.periods.map((period) => {
    const end = snapshot.match.closedPeriods.find(
      (entry) => entry.number === period.number,
    )?.elapsedMs;
    const totals = new Map(snapshot.players.map((player) => [player.id, 0]));
    let reliable = lineupReliable && end !== undefined;
    let cursor = 0;
    let lastKnownTime = 0;

    function addInterval(until: number): void {
      for (const id of active)
        totals.set(id, (totals.get(id) ?? 0) + until - cursor);
      cursor = until;
    }

    for (const event of ordered.filter(
      (entry) => entry.period === period.number,
    )) {
      history.push(event);
      if (
        event.kind === "card" &&
        event.colour !== "yellow" &&
        event.lineupEffect === undefined
      ) {
        reliable = false;
        lineupReliable = false;
      }
      if (event.gameTime) {
        if (
          event.gameTime.elapsedMs < lastKnownTime ||
          (end !== undefined && event.gameTime.elapsedMs > end)
        )
          reliable = false;
        lastKnownTime = event.gameTime.elapsedMs;
      }
      if (!changesLineup(event)) continue;
      const next = deriveChronologicalMatchState(snapshot, history);
      if (!next.valid) reliable = false;
      if (samePlayers(active, next.activePlayerIds)) continue;
      const elapsed = event.gameTime?.elapsedMs;
      if (
        elapsed === undefined ||
        elapsed < cursor ||
        (end !== undefined && elapsed > end)
      ) {
        reliable = false;
        lineupReliable = false;
      } else {
        addInterval(elapsed);
      }
      active = next.activePlayerIds;
    }
    if (!validateChronologicalEventHistory(snapshot, history).allowed) {
      reliable = false;
      lineupReliable = false;
    }
    if (end !== undefined && end >= cursor) addInterval(end);
    else reliable = false;
    return { period: period.number, players: reliable ? totals : undefined };
  });
}
