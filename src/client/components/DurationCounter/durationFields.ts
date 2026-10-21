import type { DurationFields } from "./DurationCounter.interfaces";
export function getDurationFields(milliseconds: number): DurationFields {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  return { minutes: Math.floor(seconds / 60), seconds: seconds % 60 };
}
export function parseDurationFields(
  value: DurationFields,
  maxMs?: number,
): number | null {
  if (
    typeof value.minutes !== "number" ||
    typeof value.seconds !== "number" ||
    !Number.isInteger(value.minutes) ||
    !Number.isInteger(value.seconds) ||
    value.minutes < 0 ||
    value.seconds < 0 ||
    value.seconds > 59
  )
    return null;
  const result = value.minutes * 60_000 + value.seconds * 1000;
  return Number.isSafeInteger(result) &&
    (maxMs === undefined || result <= maxMs)
    ? result
    : null;
}
