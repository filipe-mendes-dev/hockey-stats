import type { MatchEvent } from "../../../../domain/matches/matchEvent.schema";
import type {
  TeamPlayerStint,
  TeamPeriodLineupTimeline,
} from "../../../../domain/matches/lineupTimeline";
import type {
  TimelineMarkerLayout,
  TimelinePeriodLayout,
} from "./PlayerLineupTimeline.interfaces";

export const timelinePeriodGap = 32;

export function getStintEvents(
  stint: TeamPlayerStint,
  period: number,
  events: readonly MatchEvent[],
): MatchEvent[] {
  return events
    .filter(
      (event) =>
        event.deletedAt === undefined &&
        event.period === period &&
        event.gameTime !== undefined &&
        event.gameTime.elapsedMs >= stint.startMs &&
        event.gameTime.elapsedMs <= stint.endMs &&
        "matchPlayerId" in event &&
        event.matchPlayerId === stint.matchPlayerId &&
        event.kind !== "player-in" &&
        event.kind !== "player-out" &&
        event.kind !== "suspension-end",
    )
    .sort(
      (left, right) =>
        (left.gameTime?.elapsedMs ?? 0) - (right.gameTime?.elapsedMs ?? 0) ||
        left.order - right.order,
    );
}

export function getConfirmedTimelineEvents(
  period: TeamPeriodLineupTimeline,
  events: readonly MatchEvent[],
): MatchEvent[] {
  return events.filter(
    (event) =>
      event.period === period.period &&
      (period.unknownFromMs === undefined ||
        (event.gameTime !== undefined &&
          (event.gameTime.elapsedMs < period.unknownFromMs ||
            (event.gameTime.elapsedMs === period.unknownFromMs &&
              period.issue?.event?.period === event.period &&
              event.order < period.issue.event.order)))),
  );
}

export function getTimelineWidth(
  period: TeamPeriodLineupTimeline,
  events: readonly MatchEvent[],
  targetSize = 24,
): number {
  return Math.ceil(
    Math.max(
      0,
      ...period.stints.map((stint) => {
        const count = getStintEvents(stint, period.period, events).length;
        return count && stint.endMs > stint.startMs
          ? ((count * targetSize + 10) * period.extentMs) /
              (stint.endMs - stint.startMs)
          : 0;
      }),
    ),
  );
}

function timelineTicks(extent: number, scale: number): number[] {
  const step =
    [30_000, 60_000, 150_000, 300_000, 600_000].find(
      (value) => value * scale >= 90,
    ) ?? 600_000;
  const ticks = [0];
  for (let at = step; at < extent; at += step)
    if ((extent - at) * scale >= 60) ticks.push(at);
  if (extent > 0) ticks.push(extent);
  return ticks;
}

export function layoutTimelinePeriods(
  periods: readonly TeamPeriodLineupTimeline[],
  events: readonly MatchEvent[],
  availableWidth: number,
  targetSize: number,
): TimelinePeriodLayout[] {
  const duration = periods.reduce(
    (total, period) => total + period.extentMs,
    0,
  );
  const reserved =
    Math.max(0, periods.length - 1) * timelinePeriodGap +
    periods.filter((period) => period.extentMs === 0).length * 120;
  const minimumScale =
    duration > 0 ? Math.max(0, availableWidth - reserved) / duration : 0;
  const scale = Math.max(
    minimumScale,
    ...periods.map((period) =>
      period.extentMs > 0
        ? getTimelineWidth(
            period,
            getConfirmedTimelineEvents(period, events),
            targetSize,
          ) / period.extentMs
        : 0,
    ),
  );
  let left = 0;
  return periods.map((timeline) => {
    const width = timeline.extentMs > 0 ? timeline.extentMs * scale : 120;
    const result = {
      timeline,
      events: getConfirmedTimelineEvents(timeline, events),
      left,
      width,
      ticks: timelineTicks(timeline.extentMs, scale),
    };
    left += width + timelinePeriodGap;
    return result;
  });
}

export function layoutStintMarkers(
  stint: TeamPlayerStint,
  events: readonly MatchEvent[],
  width: number,
  nameWidth: number,
  targetSize = 24,
): TimelineMarkerLayout {
  const label = {
    left: 10,
    width: Math.max(0, Math.min(nameWidth, width - 20)),
  };
  const inset = Math.min(targetSize / 2 + 3, Math.max(0, width - 4) / 2);
  const end = Math.max(inset, width - 4 - inset);
  const gap =
    events.length > 1
      ? Math.min(targetSize, (end - inset) / (events.length - 1))
      : 0;
  const positions = events.map((event) =>
    Math.max(
      inset,
      Math.min(
        end,
        (((event.gameTime?.elapsedMs ?? stint.startMs) - stint.startMs) /
          Math.max(1, stint.endMs - stint.startMs)) *
          width,
      ),
    ),
  );
  for (let index = 1; index < positions.length; index++)
    positions[index] = Math.max(
      positions[index] ?? inset,
      (positions[index - 1] ?? inset) + gap,
    );
  if (positions.length)
    positions[positions.length - 1] = Math.min(positions.at(-1) ?? end, end);
  for (let index = positions.length - 2; index >= 0; index--)
    positions[index] = Math.min(
      positions[index] ?? end,
      (positions[index + 1] ?? end) - gap,
    );
  return { positions, label };
}
