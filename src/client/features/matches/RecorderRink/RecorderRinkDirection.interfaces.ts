import type { RinkAttackDirection } from "../../../../domain/matches/rinkPosition";

export interface RecorderRinkDirectionProps {
  direction: RinkAttackDirection;
  compact?: boolean;
}
