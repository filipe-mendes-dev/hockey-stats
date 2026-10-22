import type { Match } from "./match.schema";

export const halfDurationPresets = [15, 18, 20, 25] as const;

export function getDefaultHalfDuration(
  category: string | undefined,
): number | undefined {
  const value = category?.trim().toLowerCase().replace(/[\s-]/g, "");
  if (
    value === "senior" ||
    value === "veteran" ||
    value === "u19" ||
    value === "sub19"
  )
    return 25;
  if (
    value === "u17" ||
    value === "sub17" ||
    value === "u15" ||
    value === "sub15"
  )
    return 20;
  if (value === "u13" || value === "sub13") return 18;
  return undefined;
}

export function createRegulationPeriods(minutes: number): Match["periods"] {
  return [1, 2].map((number) => ({
    number,
    durationMs: minutes * 60_000,
    attackDirection: "toward-x1",
  }));
}

export function getHalfDurationMinutes(
  periods: Match["periods"],
): number | undefined {
  const duration = periods[0]?.durationMs;
  return periods.length === 2 &&
    duration !== undefined &&
    periods[1]?.durationMs === duration
    ? duration / 60_000
    : undefined;
}
