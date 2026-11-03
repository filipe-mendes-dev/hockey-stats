import type { MatchEvent, MatchTime } from "./matchEvent.schema";

export interface MatchEventTime {
  period: number;
  gameTime?: MatchTime | undefined;
}

interface OrderedMatchEvent extends MatchEventTime {
  id: string;
  order: number;
  deletedAt?: number | undefined;
}

export function sortMatchEvents<Event extends OrderedMatchEvent>(
  events: readonly Event[],
  newestFirst = false,
): Event[] {
  const direction = newestFirst ? -1 : 1;
  return events
    .filter((event) => event.deletedAt === undefined)
    .sort((left, right) => {
      if (left.period !== right.period)
        return direction * (left.period - right.period);
      if (!left.gameTime)
        return right.gameTime ? 1 : direction * (left.order - right.order);
      if (!right.gameTime) return -1;
      return (
        direction *
        (left.gameTime.elapsedMs - right.gameTime.elapsedMs ||
          left.order - right.order)
      );
    });
}

export function getMatchEventsAtTime(
  events: readonly MatchEvent[],
  time: MatchEventTime,
): MatchEvent[] {
  return sortMatchEvents(events).filter(
    (event) =>
      event.period < time.period ||
      (event.period === time.period &&
        (!event.gameTime ||
          !time.gameTime ||
          event.gameTime.elapsedMs <= time.gameTime.elapsedMs)),
  );
}

export function getMatchEventsThroughEvent(
  events: readonly MatchEvent[],
  event: MatchEvent,
): MatchEvent[] {
  const ordered = sortMatchEvents(events);
  return ordered.slice(
    0,
    ordered.findIndex((entry) => entry.id === event.id) + 1,
  );
}
