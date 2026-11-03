import type { RinkAttackDirection } from "../../../../domain/matches/rinkPosition";

export interface RecorderDirectionPickerProps {
  direction: RinkAttackDirection | undefined;
  disabled: boolean;
  onChange: (direction: RinkAttackDirection) => void;
}
