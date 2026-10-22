import type {
  AddMatchEventInput,
  RinkHalf,
  RinkPosition,
} from "./matchEvent.schema";

export type RinkAttackDirection = "toward-x0" | "toward-x1";

export function toTeamPosition(
  point: RinkPosition,
  direction: RinkAttackDirection,
): RinkPosition {
  return direction === "toward-x1"
    ? { x: point.y, y: point.x }
    : { x: 1 - point.y, y: 1 - point.x };
}

export function toViewPosition(
  point: RinkPosition,
  direction: RinkAttackDirection,
): RinkPosition {
  return direction === "toward-x1"
    ? { x: point.y, y: point.x }
    : { x: 1 - point.y, y: 1 - point.x };
}

export function getPositionHalf(position: RinkPosition): RinkHalf | undefined {
  if (Math.abs(position.y - 0.5) < 0.000001) return undefined;
  return position.y < 0.5 ? "defensive" : "attacking";
}

export function supportsRinkPosition(
  kind: AddMatchEventInput["kind"],
): boolean {
  return ["ball-recovery", "ball-loss", "shot", "team-foul", "card"].includes(
    kind,
  );
}
