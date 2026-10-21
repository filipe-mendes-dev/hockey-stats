import type { Match } from "./match.schema";

export interface PowerplayPenalty {
  cardEventId: string;
  colour: "blue" | "red";
  remainingMs: number | undefined;
}

export function getPlayingTime(
  match: Match,
  periodNumber: number,
  elapsedMs: number | undefined,
): number | undefined {
  if (elapsedMs === undefined) return undefined;
  let total = elapsedMs;
  for (const period of match.periods) {
    if (period.number >= periodNumber) break;
    const duration =
      match.closedPeriods.find((entry) => entry.number === period.number)
        ?.elapsedMs ?? period.durationMs;
    if (duration === undefined) return undefined;
    total += duration;
  }
  return total;
}

export function getPowerplayDuration(colour: "blue" | "red"): number {
  return colour === "blue" ? 120_000 : 240_000;
}

export function getPowerplayRemainingMs(
  penalties: readonly PowerplayPenalty[],
): number | undefined {
  let total = 0;
  for (const penalty of penalties) {
    if (penalty.remainingMs === undefined) return undefined;
    total += penalty.remainingMs;
  }
  return total;
}
