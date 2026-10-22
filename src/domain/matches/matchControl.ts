import { z } from "zod";
import { matchSchema, matchPeriodSchema } from "./match.schema";
import type { Match } from "./match.schema";

export const matchControlActionSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("clock.start") }),
  z.strictObject({ type: z.literal("clock.pause") }),
  z.strictObject({
    type: z.literal("clock.adjust"),
    elapsedMs: z.int().nonnegative(),
  }),
  z.strictObject({
    type: z.literal("period.direction"),
    attackDirection: matchPeriodSchema.shape.attackDirection,
  }),
  z.strictObject({ type: z.literal("period.end") }),
  z.strictObject({ type: z.literal("match.end") }),
]);
export const controlMatchInputSchema = z.strictObject({
  id: z.uuidv4(),
  expectedRevision: z.int().positive(),
  action: matchControlActionSchema,
});
export type MatchControlAction = z.infer<typeof matchControlActionSchema>;
export type ControlMatchInput = z.infer<typeof controlMatchInputSchema>;

export class InvalidMatchControlError extends Error {
  constructor() {
    super("The Match or clock changed, or this transition is unavailable.");
    this.name = "InvalidMatchControlError";
  }
}
export function getClockElapsed(match: Match, now: number): number | undefined {
  if (!match.clock) return undefined;
  const elapsed =
    match.clock.elapsedMs +
    (match.clock.runningSince === undefined
      ? 0
      : Math.max(0, now - match.clock.runningSince));
  const duration = match.periods.find(
    (period) => period.number === match.currentPeriod,
  )?.durationMs;
  return Math.floor(
    duration === undefined ? elapsed : Math.min(duration, elapsed),
  );
}
export function formatMatchTime(elapsedMs: number): string {
  return `${String(Math.floor(elapsedMs / 60_000)).padStart(2, "0")}:${String(Math.floor(elapsedMs / 1000) % 60).padStart(2, "0")}`;
}
export function getCountdownMs(
  elapsedMs: number | undefined,
  durationMs: number | undefined,
): number | undefined {
  if (elapsedMs === undefined || durationMs === undefined) return undefined;
  return Math.ceil(Math.max(0, durationMs - elapsedMs) / 1000) * 1000;
}
export function formatCountdown(
  elapsedMs: number | undefined,
  durationMs: number | undefined,
): string | undefined {
  const remaining = getCountdownMs(elapsedMs, durationMs);
  return remaining === undefined ? undefined : formatMatchTime(remaining);
}
export function applyMatchControl(
  match: Match,
  action: MatchControlAction,
  now: number,
): Match {
  if (match.status !== "live" || now < match.updatedAt)
    throw new InvalidMatchControlError();
  const period = match.periods.find(
    (entry) => entry.number === match.currentPeriod,
  );
  if (!period) throw new InvalidMatchControlError();
  const next: Match = {
    ...match,
    revision: match.revision + 1,
    updatedAt: now,
  };
  const elapsedMs = getClockElapsed(match, now);
  switch (action.type) {
    case "clock.start":
      if (
        match.clock?.runningSince !== undefined ||
        period.durationMs === undefined ||
        (elapsedMs ?? 0) >= period.durationMs
      )
        throw new InvalidMatchControlError();
      next.clock = { elapsedMs: elapsedMs ?? 0, runningSince: now };
      break;
    case "clock.pause":
      if (match.clock?.runningSince === undefined || elapsedMs === undefined)
        throw new InvalidMatchControlError();
      next.clock = { elapsedMs };
      break;
    case "clock.adjust":
      if (
        period.durationMs !== undefined &&
        action.elapsedMs > period.durationMs
      )
        throw new InvalidMatchControlError();
      next.clock = {
        elapsedMs: action.elapsedMs,
        ...(match.clock?.runningSince !== undefined &&
        action.elapsedMs < (period.durationMs ?? Infinity)
          ? { runningSince: now }
          : {}),
      };
      break;
    case "period.direction":
      next.periods = match.periods.map((entry) =>
        entry.number === match.currentPeriod
          ? { ...entry, attackDirection: action.attackDirection }
          : entry,
      );
      break;
    case "period.end":
    case "match.end": {
      const final = match.currentPeriod === match.periods.length;
      if ((action.type === "match.end") !== final)
        throw new InvalidMatchControlError();
      next.closedPeriods = [
        ...match.closedPeriods,
        {
          number: match.currentPeriod,
          ...(elapsedMs === undefined ? {} : { elapsedMs }),
        },
      ];
      if (final) {
        next.status = "completed";
        next.completedAt = now;
        next.clock = elapsedMs === undefined ? undefined : { elapsedMs };
      } else {
        next.currentPeriod += 1;
        next.clock = { elapsedMs: 0 };
      }
      break;
    }
  }
  return matchSchema.parse(next);
}
