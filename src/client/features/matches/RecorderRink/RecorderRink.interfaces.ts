import type { RinkPosition } from "../../../../domain/matches/matchEvent.schema";
import type { RinkAttackDirection } from "../../../../domain/matches/rinkPosition";

export interface RecorderRinkPickerProps {
  period: number;
  direction: RinkAttackDirection | undefined;
  position?: RinkPosition | undefined;
  disabled?: boolean;
  autoFocus?: boolean;
  purpose?: "register" | "position";
  controlsDisabled: boolean;
  onChangeDirection: () => void;
  onClear?: (() => void) | undefined;
  onStart: () => void;
  onSelect: (position: RinkPosition) => void;
  onCancelGesture: () => void;
}

export interface RecorderRinkProps extends RecorderRinkPickerProps {
  inert?: boolean;
}

export interface RecorderRinkSession {
  gestureActive: boolean;
  onChangeDirection: () => void;
  direction: RinkAttackDirection | undefined;
  onStart: () => void;
  onSelect: (position: RinkPosition) => void;
  onCancelGesture: () => void;
}
